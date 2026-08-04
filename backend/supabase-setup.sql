-- ============================================================
-- SCALE INDIA — Assessment Management Portal
-- Supabase setup: run AFTER `npx prisma migrate deploy`
-- SQL Editor → new query → paste → Run
-- ============================================================

-- ── 1. Keep public.users in sync with auth.users ────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, "fullName", role, "createdAt", "updatedAt")
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce((new.raw_user_meta_data->>'role')::"Role", 'ADMIN'),
    now(), now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. Role helper ──────────────────────────────────────────

create or replace function public.current_role()
returns text
language sql stable security definer set search_path = public
as $$ select role::text from public.users where id = auth.uid() $$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.current_role() in ('SUPER_ADMIN','ADMIN') $$;

-- ── 3. Enable RLS everywhere ────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'users','states','districts','schemes','job_roles','training_partners',
    'training_centres','assessors','question_papers','candidates','assessments',
    'attendance','results','media_assets','audit_logs','notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ── 4. Policies ─────────────────────────────────────────────

-- Own profile
create policy "read own profile" on public.users
  for select using (id = auth.uid() or public.is_admin());
create policy "super admin manages users" on public.users
  for all using (public.current_role() = 'SUPER_ADMIN')
  with check (public.current_role() = 'SUPER_ADMIN');

-- Master data: readable by any signed-in user, writable by admins
do $$
declare t text;
begin
  foreach t in array array[
    'states','districts','schemes','job_roles','training_partners',
    'training_centres','assessors','question_papers','candidates'
  ]
  loop
    execute format($p$
      create policy "signed in read %1$s" on public.%1$I
        for select using (auth.uid() is not null);
      create policy "admin write %1$s" on public.%1$I
        for all using (public.is_admin()) with check (public.is_admin());
    $p$, t);
  end loop;
end $$;

-- Assessments: admins see all; an assessor sees only their own allotments
create policy "admin all assessments" on public.assessments
  for all using (public.is_admin()) with check (public.is_admin());

create policy "assessor reads own assessments" on public.assessments
  for select using (
    exists (
      select 1 from public.assessors a
      where a.id = assessments."assessorId" and a."userId" = auth.uid()
    )
  );

-- Assessor may update ONLY while the record is unlocked
create policy "assessor updates unlocked assessment" on public.assessments
  for update using (
    "isLocked" = false and exists (
      select 1 from public.assessors a
      where a.id = assessments."assessorId" and a."userId" = auth.uid()
    )
  )
  with check ("isLocked" is not null);

-- Attendance / media / results follow the parent assessment
do $$
declare t text;
begin
  foreach t in array array['attendance','media_assets','results']
  loop
    execute format($p$
      create policy "admin all %1$s" on public.%1$I
        for all using (public.is_admin()) with check (public.is_admin());
      create policy "assessor own %1$s" on public.%1$I
        for all using (
          exists (
            select 1 from public.assessments s
            join public.assessors a on a.id = s."assessorId"
            where s.id = %1$I."assessmentId"
              and a."userId" = auth.uid()
              and s."isLocked" = false
          )
        )
        with check (
          exists (
            select 1 from public.assessments s
            join public.assessors a on a.id = s."assessorId"
            where s.id = %1$I."assessmentId"
              and a."userId" = auth.uid()
              and s."isLocked" = false
          )
        );
    $p$, t);
  end loop;
end $$;

-- Audit logs: readable by admins, insert-only for everyone, never updated or deleted
create policy "admin reads audit" on public.audit_logs
  for select using (public.is_admin());
create policy "anyone appends audit" on public.audit_logs
  for insert with check (auth.uid() is not null);

create policy "read notifications" on public.notifications
  for select using (auth.uid() is not null);
create policy "admin writes notifications" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- ── 5. Assessment key generator ─────────────────────────────

create or replace function public.generate_assessment_key(d date)
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- no I/O/0/1
  suffix text := '';
  i int;
  candidate text;
begin
  loop
    suffix := '';
    for i in 1..5 loop
      suffix := suffix || substr(chars, floor(random()*length(chars))::int + 1, 1);
    end loop;
    candidate := 'LSSC-' || to_char(d,'YYYYMMDD') || '-' || suffix;
    exit when not exists (select 1 from public.assessments where "assessmentKey" = candidate);
  end loop;
  return candidate;
end;
$$;

-- ── 6. Hard lock: a submitted assessment can never be edited ─

create or replace function public.enforce_assessment_lock()
returns trigger language plpgsql as $$
begin
  if old."isLocked" = true then
    raise exception 'Assessment % is locked and cannot be modified', old."assessmentKey"
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assessment_lock on public.assessments;
create trigger trg_assessment_lock
  before update or delete on public.assessments
  for each row execute function public.enforce_assessment_lock();

-- Same guard for child rows
create or replace function public.enforce_child_lock()
returns trigger language plpgsql as $$
declare locked boolean;
begin
  select "isLocked" into locked from public.assessments
   where id = coalesce(new."assessmentId", old."assessmentId");
  if locked then
    raise exception 'Parent assessment is locked' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['attendance','media_assets','results']
  loop
    execute format('drop trigger if exists trg_child_lock on public.%I', t);
    execute format('create trigger trg_child_lock before insert or update or delete on public.%I
                    for each row execute function public.enforce_child_lock()', t);
  end loop;
end $$;

-- ── 7. Audit trigger on assessments ─────────────────────────

create or replace function public.audit_assessment()
returns trigger language plpgsql security definer as $$
begin
  insert into public.audit_logs (id, action, entity, "entityId", detail, "userId", "createdAt")
  values (
    gen_random_uuid()::text,
    tg_op || '_ASSESSMENT',
    'assessments',
    coalesce(new.id, old.id),
    coalesce(new."assessmentKey", old."assessmentKey"),
    auth.uid(),
    now()
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_assessment on public.assessments;
create trigger trg_audit_assessment
  after insert or update on public.assessments
  for each row execute function public.audit_assessment();

-- ── 8. Dashboard view ───────────────────────────────────────

create or replace view public.v_dashboard_summary as
select
  count(*)                                             as total_assessments,
  count(*) filter (where status = 'SCHEDULED')         as scheduled,
  count(*) filter (where status = 'COMPLETED')         as completed,
  count(*) filter (where status = 'DRAFT')             as draft,
  count(*) filter (where status = 'CANCELLED')         as cancelled,
  count(*) filter (where "assessmentDate"::date = current_date) as today_count,
  (select count(*) from public.candidates)             as total_candidates,
  (select count(*) from public.assessors)              as total_assessors,
  (select count(*) from public.training_partners)      as total_partners,
  (select count(*) from public.training_centres)       as total_centres,
  (select count(*) from public.question_papers)        as total_qps
from public.assessments;

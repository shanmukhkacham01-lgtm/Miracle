SELECT email, role FROM public."User" WHERE role::text IN ('ADMIN', 'SUPERADMIN');

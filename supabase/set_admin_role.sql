-- Elevate kalidseid111@gmail.com to super_admin role
DO $$
DECLARE target_user_id UUID;
BEGIN 
    -- 1. Find User ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'kalidseid111@gmail.com';

    IF target_user_id IS NOT NULL THEN 
        -- 2. Set Super Admin Role in profiles table
        UPDATE public.profiles
        SET role = 'super_admin'
        WHERE id = target_user_id;
        
        RAISE NOTICE 'User elevated to super_admin: %', target_user_id;
    ELSE 
        RAISE WARNING 'User kalidseid111@gmail.com not found in auth.users';
    END IF;
END $$;

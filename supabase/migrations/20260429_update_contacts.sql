-- Update official contact information in settings table
UPDATE settings 
SET contact_info = jsonb_set(
    jsonb_set(
        COALESCE(contact_info, '{}'::jsonb), 
        '{email}', 
        '"betesebhub@gmail.com"'
    ), 
    '{phone}', 
    '"+447347663219 / +251946414018"'
),
cms_content = jsonb_set(
    jsonb_set(
        COALESCE(cms_content, '{}'::jsonb), 
        '{email}', 
        '"betesebhub@gmail.com"'
    ), 
    '{phone}', 
    '"+447347663219 / +251946414018"'
);

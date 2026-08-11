-- ART EYE — maak PRECIES EEN account eigenaar (admin): jadebrack@gmail.com.
-- Draai dit EEN keer in de SQL Editor, NADAT je in de app een account hebt
-- aangemaakt met dit e-mailadres. Alle andere accounts blijven gewone
-- gebruikers; de admin-rol is alleen via deze SQL te zetten, nooit vanuit
-- de app zelf.

update profiles
   set role = 'admin'
 where id = (select id from auth.users where email = 'jadebrack@gmail.com');

-- Controle: precies een rij, met role = admin.
select p.role, u.email
  from profiles p
  join auth.users u on u.id = p.id
 where u.email = 'jadebrack@gmail.com';

-- Eventueel later een ander account de rol AFNEMEN (veiligheidsklep):
--   update profiles set role = 'user'
--    where id = (select id from auth.users where email = 'iemand@anders.nl');

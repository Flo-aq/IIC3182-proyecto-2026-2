-- Nombre de quien organiza la reunión (la crea sin cuenta). Con ese nombre puede cerrarla desde cualquier dispositivo, igual
-- que se entra a editar una respuesta: escribiendo el mismo nombre. Quien crea con cuenta no lo necesita (la cuenta lo identifica),
-- y la llave que se guarda en el navegador al crear sigue valiendo.
-- Es nulo en las reuniones que se crearon antes de esto o con cuenta.
alter table events
  add column if not exists owner_name text
  check (owner_name is null or char_length(btrim(owner_name)) between 1 and 40);

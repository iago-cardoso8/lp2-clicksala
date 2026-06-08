import Database from './database.js';

async function up() {
  const db = await Database.connect();

  await db.run(`
    CREATE TABLE IF NOT EXISTS sala (
      id integer primary key autoincrement,
      nome varchar(40) not null,
      bloco varchar(40) NOT NULL,
      tipo varchar(40) not null,
      capacidade integer not null,
      equipamento jsonb
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS solicitacao (
      cod_sala integer not null,
      data date NOT NULL,
      hora time NOT NULL,
      finalidade varchar(800),
      status varchar(20) not null default 'Pendente',
      foreign key (cod_sala) references sala(id)
        on delete cascade on update cascade,
      primary key (cod_sala, data, hora)
    )
  `);
}

export default { up };

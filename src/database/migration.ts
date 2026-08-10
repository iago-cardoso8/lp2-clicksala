import { prisma } from './prismaClient.js';

// ver como fzr migration por cmd, em vez de arquivo migration

async function up() {
  await prisma.$connect();

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS usuario (
      id integer primary key autoincrement,
      nome varchar(80) not null,
      email varchar(255) not null unique,
      senha varchar(255) not null
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS sala (
      id integer primary key autoincrement,
      nome varchar(40) not null,
      bloco varchar(40) NOT NULL,
      tipo varchar(40) not null,
      capacidade integer not null,
      equipamento json
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS solicitacao (
      cod_sala integer not null,
      data TEXT NOT NULL,
      hora TEXT NOT NULL,
      finalidade varchar(800),
      status varchar(20) not null default 'Pendente',
      id_user integer not null,
      foreign key (cod_sala) references sala(id)
        on delete cascade on update cascade,
      foreign key (id_user) references usuario(id)
        on delete cascade on update cascade,
      primary key (cod_sala, data, hora)
    )
  `);
}

export default { up };

import { prisma } from './prismaClient.js';

// ver como fzr migration por cmd, em vez de arquivo migration

async function up() {
  await prisma.$connect();

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS usuario (
      id integer primary key autoincrement,
      nome varchar(100) not null,
      email varchar(255) not null unique,
      senha varchar(255) not null,
      role varchar(20) not null default 'user'
    )
  `);

  const usuarioColumns = await prisma.$queryRawUnsafe<Array<{ name: string }>>('PRAGMA table_info(usuario)');
  if (!usuarioColumns.some((column) => column.name === 'role')) {
    await prisma.$executeRawUnsafe("ALTER TABLE usuario ADD COLUMN role varchar(20) not null default 'user'");
  }

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

  const solicitacaoColumns = await prisma.$queryRawUnsafe<Array<{ name: string }>>('PRAGMA table_info(solicitacao)');
  const createSolicitacaoTable = `
    CREATE TABLE solicitacao (
      id integer primary key autoincrement,
      cod_sala integer not null,
      data TEXT NOT NULL,
      hora TEXT NOT NULL,
      finalidade varchar(800),
      status varchar(20) not null default 'Pendente',
      id_user integer not null,
      foreign key (cod_sala) references sala(id)
        on delete cascade on update cascade,
      foreign key (id_user) references usuario(id)
        on delete cascade on update cascade
    )
  `;

  if (solicitacaoColumns.length === 0) {
    await prisma.$executeRawUnsafe(createSolicitacaoTable);
  } else if (!solicitacaoColumns.some((column) => column.name === 'id')) {
    await prisma.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe('ALTER TABLE solicitacao RENAME TO solicitacao_legacy');
      await transaction.$executeRawUnsafe(createSolicitacaoTable);
      await transaction.$executeRawUnsafe(`
        INSERT INTO solicitacao (cod_sala, data, hora, finalidade, status, id_user)
        SELECT cod_sala, data, hora, finalidade, status, id_user
        FROM solicitacao_legacy
      `);
      await transaction.$executeRawUnsafe('DROP TABLE solicitacao_legacy');
    });
  }

  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS solicitacao_horario_idx ON solicitacao (cod_sala, data, hora)'
  );
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS solicitacao_ativa_usuario_horario_idx
    ON solicitacao (cod_sala, data, hora, id_user)
    WHERE status IN ('Pendente', 'Aprovado')
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS solicitacao_horario_aprovado_idx
    ON solicitacao (cod_sala, data, hora)
    WHERE status = 'Aprovado'
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS image (
      id integer primary key autoincrement,
      filename varchar(255) not null unique,
      mimeType varchar(80) not null,
      size integer not null,
      publicUrl varchar(255) not null unique,
      userId integer not null unique,
      foreign key (userId) references usuario(id)
        on delete cascade on update cascade
    )
  `);
}

export default { up };

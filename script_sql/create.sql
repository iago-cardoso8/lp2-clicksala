CREATE TABLE IF NOT EXISTS usuario (
id integer primary key autoincrement,
nome varchar(100) not null,
email varchar(255) not null unique,
senha varchar(255) not null,
role varchar(20) not null default 'user'
);
CREATE TABLE IF NOT EXISTS sala (
id integer primary key autoincrement,
nome varchar(40) not null,
bloco varchar(40) NOT NULL,
tipo varchar(40) not null,
capacidade integer not null,
equipamento jsonb
);
CREATE TABLE IF NOT EXISTS solicitacao (
id integer primary key autoincrement,
cod_sala integer not null,
data date NOT NULL,
hora time NOT NULL,
finalidade varchar(800),
status varchar(20) not null default 'Pendente',
id_user integer not null,
foreign key (cod_sala) references sala(id)
    on delete cascade on update cascade,
foreign key (id_user) references usuario(id)
    on delete cascade on update cascade
);
CREATE INDEX IF NOT EXISTS solicitacao_horario_idx
    ON solicitacao (cod_sala, data, hora);
CREATE UNIQUE INDEX IF NOT EXISTS solicitacao_ativa_usuario_horario_idx
    ON solicitacao (cod_sala, data, hora, id_user)
    WHERE status IN ('Pendente', 'Aprovado');
CREATE UNIQUE INDEX IF NOT EXISTS solicitacao_horario_aprovado_idx
    ON solicitacao (cod_sala, data, hora)
    WHERE status = 'Aprovado';

-- A fim de facilitar a implementação do Banco de Dados no backend da aplicação, decidimos, em comum acordo com o professor, 
-- reduzir a quantidade de tabelas antes especificadas e simplificar os relacionamentos, uma vez que o vigente projeto tem 
-- como objetivo implementar, de maneira prática, apenas o módulo USUÁRIO previsto do documento de especificação.
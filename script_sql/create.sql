CREATE TABLE IF NOT EXISTS sala (
id integer primary key autoincrement,
nome varchar(40) not null,
bloco varchar(40) NOT NULL,
tipo varchar(40) not null,
capacidade integer not null,
equipamento jsonb
);
CREATE TABLE IF NOT EXISTS solicitacao (
cod_sala integer not null,
data date NOT NULL,
hora time NOT NULL,
finalidade varchar(800),
status varchar(20) not null default 'Pendente',
foreign key (cod_sala) references sala(id)
    on delete cascade on update cascade,
primary key (cod_sala, data, hora)
);

-- A fim de facilitar a implementação do Banco de Dados no backend da aplicação, decidimos, em comum acordo com o professor, 
-- reduzir a quantidade de tabelas antes especificadas e simplificar os relacionamentos, uma vez que o vigente projeto tem 
-- como objetivo implementar, de maneira prática, apenas o módulo USUÁRIO previsto do documento de especificação.
drop database if exists node_tests;
create database node_tests;
use node_tests;
select database() from dual;

grant all on node_tests.* to 'user'@'localhost' identified by 'password';
flush privileges;

create table messages (
    id int not null auto_increment,
    poster varchar(128) not null,
	text varchar(255) not null,
    primary key (id)
);

insert into messages set poster='Bob', text='Hello there';
insert into messages set poster='Ed', text='Hello there back';
insert into messages set poster='Bob', text='Hello there better';

select * from messages;



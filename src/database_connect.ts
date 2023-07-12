import { DataSource } from 'typeorm';
import { Users } from './stuff/entities/Data';
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'pepega',
  database: 'cybruv',
  password: 'peepustrong',
  entities: [Users],
  synchronize: true,
  logging: true,
});

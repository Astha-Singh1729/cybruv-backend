import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
//id, name, password, email, cybrosmember?, cfhandle
@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  cfhandle: string;

  @Column()
  isCybrosMember: boolean = false;

  @Column({ nullable: true })
  problemOfTheDay: string;

  @Column({ nullable: true })
  curdate: string;

  @Column({ nullable: true, unique: true })
  cookie: string;
}

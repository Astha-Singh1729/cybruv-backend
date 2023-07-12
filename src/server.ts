import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './database_connect';
import { params } from './queries';
import { Users } from './stuff/entities/Data';
import axios from 'axios';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
const main = async () => {
  AppDataSource.initialize()
    .then(() => {
      console.log('ho gya connect? pausechamp');
    })
    .catch((err) => console.log(err));
  const app = express();
  const port = 8000;
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors());
  app.get('/:name', params);

  app.post('/register', async (req, res) => {
    const { name, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).send('Empty fields');
    }

    const existingUser = await AppDataSource.getRepository(Users).findOne({
      where: {
        username: username,
      },
    });

    if (existingUser) {
      return res.status(400).send('User already exists');
    }

    try {
      const cookieValue = crypto.randomBytes(16).toString('base64');
      const hashedPassword = bcrypt.hashSync(password, 10);

      const insertedUser = await AppDataSource.createQueryBuilder()
        .insert()
        .into(Users)
        .values([
          {
            name: name,
            username: username,
            isCybrosMember: false,
            password: hashedPassword,
            cookie: cookieValue,
          },
        ])
        .returning('*')
        .execute();

      const newUser = insertedUser.generatedMaps[0];
      const options = {
        maxAge: 1000 * 60 * 15,
        httpOnly: true,
      };

      res.cookie('ghevar', cookieValue, options);
      return res.sendStatus(200);
    } catch (error) {
      console.log(error);
      return res.status(500).send('Registration failed');
    }
  });

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send('Empty fields');
    }

    const user = await AppDataSource.getRepository(Users)
      .createQueryBuilder()
      .where('username = :username', { username: username })
      .getOne();

    if (!user) {
      return res.status(400).send('User does not exist');
    }

    try {
      const matches = bcrypt.compareSync(password, user.password);

      if (!matches) {
        return res.status(400).send('Wrong password');
      }

      const options = {
        maxAge: 1000 * 60 * 15,
        httpOnly: true,
      };

      const cookieValue = crypto.randomBytes(16).toString('base64');
      await AppDataSource.createQueryBuilder()
        .update(Users)
        .set({ cookie: cookieValue })
        .where('id = :id', { id: user.id })
        .execute();

      res.cookie('ghevar', cookieValue, options);
      return res.status(200).send('Login successful');
    } catch (error) {
      console.error(error);
      return res.status(500).send('Login failed');
    }
  });

  app.post('/me', async (req, res) => {
    const user = await AppDataSource.getRepository(Users).findOne({
      where: {
        cookie: req.cookies.ghevar,
      },
    });

    if (!user || !req.cookies.ghevar) {
      return res.status(401).send('Invalid cookie');
    }

    console.log(user.id);
    return res.status(200).send(user.id.toString());
  });

  app.post('/verify', async (req, res) => {
    var starttime = Math.floor(Date.now() / 1000) - 5;
    console.log(starttime);
    setTimeout(async () => {
      console.log('axios call');
      await axios
        .get(
          `https://codeforces.com/api/user.status?handle=${req.body.handle}&from=1&count=15`
        )
        .then(async (response) => {
          let flag = false;
          response?.data.result.map((obj: any) => {
            flag =
              flag ||
              (obj.creationTimeSeconds > starttime &&
                obj.problem.contestId == 1774 &&
                obj.problem.index == 'H' &&
                obj.verdict == 'COMPILATION_ERROR');
          });
          if (flag) {
            await AppDataSource.createQueryBuilder()
              .update(Users)
              .set({
                cfhandle: req.body.handle,
              })
              .where('id = :id', { id: req.body.id })
              .execute();
            return res.status(200).send('handle verified');
          } else {
            return res.status(400).send('sorry can you try again?');
          }
        })
        .catch((_) => {
          return res.status(400).send('wrong cfhandle');
        });
    }, 60000);
  });

  app.post('/podultimate', async (req, res) => {
    const User: any = await AppDataSource.getRepository(Users)
      .createQueryBuilder()
      .where('id = :id', { id: req.body.id })
      .getOne();
    if (User == null) {
      return res.status(400).send('wrong id');
    }

    if (User.cfhandle == null) {
      return res.status(400).send('set handle');
    }
    const myDate = new Date();
    const curDate =
      myDate.getDate().toString() +
      '.' +
      (myDate.getMonth() + 1).toString() +
      '.' +
      myDate.getFullYear().toString();

    if (User.curdate == curDate) {
      return res.status(200).send(User.problemOfTheDay.toString());
    }

    await axios
      .get(`https://codeforces.com/api/user.info?handles=${User.cfhandle}`)
      .then(async (rating) => {
        const max = 6;
        const min = 2;
        const randomRating =
          (Math.max(Math.floor(rating.data.result[0].rating / 100), 6) +
            Math.floor(Math.random() * (max - min) + min) +
            Math.floor(Math.random() * 2)) *
          100;
        const rndRating = Math.min(randomRating, 3500);
        const response = await axios.get(
          ` https://codeforces.com/api/problemset.problems`
        );

        const problems: string[] = [];
        response.data.result.problems.map((obj: any) => {
          if (obj.rating == rndRating) {
            const str = `https://codeforces.com/problemset/problem/${obj.contestId}/${obj.index}`;
            problems.push(str);
          }
        });
        console.log(problems.length);
        const len = Math.floor(
          problems.length / (Math.floor(Math.random() * 3) + 1)
        );
        const tosend = problems[Math.floor(Math.random() * len)];

        //update
        await AppDataSource.createQueryBuilder()
          .update(Users)
          .set({
            curdate: curDate,
            problemOfTheDay: tosend,
          })
          .where('id = :id', { id: req.body.id })
          .execute();
        return res.status(200).send(tosend.toString());
      })
      .catch((_) => {
        return res.status(400).send('somethings wrong');
      });
    return res.send('what?');
  });

  app.listen(port, () => {
    console.log(`server running on ${port}`);
  });
};
main().catch((err) => console.log(err));

/*






*/

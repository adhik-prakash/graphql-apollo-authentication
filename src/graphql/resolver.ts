import { authenticate } from "../Middleware";
import { InputUserInterface, UserInterface } from "../interfaces";
import User from "../models/user";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
export const resolvers = {
  Query: {
    users: async () => {
      return await User.findAll();
    },

    user: async (parent: any, args: any) => {
      const user = await User.findOne({ where: { id: args?.id } });
      // console.log(user);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    },
    getUserProfile: async (parent: any, args: any, context: any) => {
      try {
        if (!context?.token) {
          throw new Error("token is missing");
        }

        const tokenData = (await authenticate(context?.token)) as JwtPayload;

        const user = User.findOne({ where: { id: tokenData?.user?.id } });

        return user;
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
  },

  Mutation: {
    register: async (
      parents: any,
      args: { input: InputUserInterface }
    ): Promise<UserInterface> => {
      const { userName, email, password, confirmPassword } = args.input;

      if (password !== confirmPassword) {
        throw new Error("Password doesnot match");
      }

      try {
        const checkEmail = await User.findOne({ where: { email: email } });

        if (checkEmail) {
          throw new Error("Email already exists");
        }
        const hashedPassed = await bcrypt.hash(password, 12);

        const newUser: any = await User.create({
          email,
          userName,
          password: hashedPassed,
        });
        return {
          id: newUser.id,
          userName: newUser.userName,
          email: newUser.email,
          message: "You have been registered Successuflly",
        };
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
    deleteUser: async (parent: any, args: any) => {
      const deleteUser = await User.findOne({ where: { id: args?.id } });
      //  console.log(deleteUser);

      if (!deleteUser) {
        throw new Error("User not found");
      }
      await deleteUser!.destroy();

      // console.log(deleteUser?.dataValues);

      return deleteUser?.dataValues;
    },
    login: async (
      parent: any,
      args: { input: InputUserInterface }
    ): Promise<UserInterface> => {
      const { email, password } = args.input;

      try {
        const userLogin = await User.findOne({ where: { email: email } });
        // console.log(userLogin);
        if (!userLogin) {
          throw new Error("This user is not registered yet");
        }

        const isValidPassword = await bcrypt.compare(
          password!.toString(),
          userLogin?.dataValues?.password
          //decrypt password and then convert to string and compare to the password the user entered.
        );
        if (!isValidPassword) {
          throw new Error(" Password you entered is incorrect");
        }
        const payload = {
          email: email,
          password: password,
          id: userLogin?.dataValues?.id,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY!, {
          expiresIn: "1d",
        });

        // console.log(userLogin);
        return {
          ...userLogin.dataValues,
          token,
          message: "Login is done successfull",
        };
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
  },
};

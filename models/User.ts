import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  HasMany
} from 'sequelize-typescript'

import { Todo } from './Todo'

@Table
export class User extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    primaryKey: true,
    unique: true,
    type: DataType.UUIDV4
  })
  declare id: string

  @Column({
    unique: true
  })
  declare username: string

  @Column
  declare name: string

  @Column
  declare password: string

  @HasMany(() => Todo)
  declare todos: Todo[]

  static getByToken(token: string) {
    const tokenData = jwt.decode(token)
    if (!tokenData) return Promise.resolve(null)
    if (typeof tokenData !== 'object') return Promise.resolve(null)
    if (!('id' in tokenData)) return Promise.resolve(null)
    const user = this.findByPk(tokenData.id)
    if (!user) return Promise.resolve(null)
    return Promise.resolve(user)
  }
}

export const types = {
  types: `
    input SignupUserInput {
      username: String!
      name: String!
      password: String!
    }

    type User {
      id: ID
      username: String
      name: String
    }
    `,
  queries: `currentUser: User`,
  mutations: `
        signupUser(input: SignupUserInput!): Status
      loginUser(username: String!, password: String!): Token
  `
}

export const resolvers = {
  Query: {
    currentUser: async (_: any, __: any, { user }: { user: User }) => {
      if (!user) {
        return new Error('UNAUTHENTICATED')
      }
      return user
    }
  },

  Mutation: {
    signupUser: async (
      _: any,
      { input: { username, password, name } }: { input: User }
    ) => {
      try {
        const userWithSameUsername = await User.findOne({
          where: { username }
        })
        if (userWithSameUsername) {
          return new Error('username is already taken')
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        await User.create({
          name,
          username,
          password: hashedPassword
        })
        return {
          status: 'success'
        }
      } catch (err) {
        console.log('Error while creating user:', err)
        return {
          status: 'error'
        }
      }
    },

    loginUser: async (_: any, { username, password }: User) => {
      try {
        const user = await User.findOne({
          where: {
            username
          }
        })
        if (!user) {
          return new Error('username or password is wrong')
        }
        const match = await bcrypt.compare(password, user.password)
        if (!match) {
          return new Error('username or password is wrong')
        }
        const token = jwt.sign({ id: user.id }, 'secretKey')
        return { token }
      } catch (err) {
        console.log('Error while logging in:', err)
        return {
          token: null
        }
      }
    }
  }
}

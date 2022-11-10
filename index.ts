import { ApolloServer, gql } from 'apollo-server'
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core'
import path from 'path'

import { Sequelize } from 'sequelize-typescript'
import {
  Todo,
  resolvers as todoResolvers,
  types as todoTypes
} from './models/Todo'
import {
  User,
  resolvers as userResolvers,
  types as userTypes
} from './models/User'

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname, './database.db')
})

sequelize.addModels([User, Todo])

User.hasMany(Todo, {
  foreignKey: 'userId'
})

const typeDefs = gql`
  type Status {
    status: String!
    message: String
  }

  type Token {
    token: String
  }

  ${userTypes.types}
  ${todoTypes.types}

  type Query {
    ${userTypes.queries}
    ${todoTypes.queries}
  }

  type Mutation {
    ${userTypes.mutations}
    ${todoTypes.mutations}
  }
`

const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...todoResolvers.Query
  },

  Mutation: {
    ...userResolvers.Mutation,
    ...todoResolvers.Mutation
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
  cache: 'bounded',
  context: async ({ req }) => {
    const token = req.headers.authorization || ''
    const user = await User.getByToken(token)
    return {
      user
    }
  },
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })]
})

const port = process.env.PORT || 4000

async function start() {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
  } catch (err) {
    console.log('Error connecting to the database: ', err)
  }
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`)
  })
}

start()

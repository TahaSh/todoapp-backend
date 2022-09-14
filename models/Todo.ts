import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  BelongsTo,
  ForeignKey
} from 'sequelize-typescript'

import { User } from './User'

@Table
export class Todo extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    primaryKey: true,
    unique: true,
    type: DataType.UUIDV4
  })
  declare id: string

  @Column
  declare title: string

  @Default(false)
  @Column
  declare completed: boolean

  @ForeignKey(() => User)
  @Column
  declare userId: string

  @BelongsTo(() => User, 'userId')
  declare user: User
}

export const types = {
  types: `
      input AddTodoInput {
        title: String
      }
      input UpdateTodoInput {
        todoId: ID
        title: String
        completed: Boolean
      }
      type Todo {
        id: ID
        title: String
        completed: Boolean
      }
    `,
  queries: `
  todos: [Todo]
    `,
  mutations: `
      addTodo(input: AddTodoInput!): Todo
      deleteTodo(todoId: ID): Status
      updateTodo(input: UpdateTodoInput): Status
  `
}

export const resolvers = {
  Query: {
    todos: async (_: any, __: any, { user }: { user: User }) => {
      try {
        if (!user) {
          return new Error('UNAUTHENTICATED')
        }
        const todos = await Todo.findAll({
          where: {
            userId: user.id
          }
        })
        return todos
      } catch (err) {
        console.log('Error while creating todo:', err)
      }
    }
  },

  Mutation: {
    addTodo: async (
      _: any,
      { input: { title } }: { input: Todo },
      { user }: { user: User }
    ) => {
      try {
        if (!user) {
          return new Error('UNAUTHENTICATED')
        }
        const todo = await user.$create('todo', {
          title
        })
        return todo
      } catch (err) {
        console.log('Error while creating todo:', err)
      }
    },

    deleteTodo: async (
      _: any,
      { todoId }: { todoId: string },
      { user }: { user: User }
    ) => {
      try {
        if (!user) {
          return new Error('UNAUTHENTICATED')
        }
        const result = await Todo.destroy({
          where: {
            id: todoId
          }
        })

        if (!result) {
          return new Error('Todo does not exist')
        }

        return { status: 'success' }
      } catch (err) {
        console.log('Error while deleting todo:', err)
      }
    },

    updateTodo: async (
      _: any,
      {
        input: { todoId, ...updateAttrs }
      }: { input: { todoId: string } & Todo },
      { user }: { user: User }
    ) => {
      try {
        if (!user) {
          return new Error('UNAUTHENTICATED')
        }
        const todo = await Todo.findByPk(todoId)
        if (!todo) {
          return new Error('Todo does not exist')
        }
        const result = await todo.update(updateAttrs)

        if (!result) {
          return new Error('Todo does not exist')
        }

        return { status: 'success' }
      } catch (err) {
        console.log('Error while deleting todo:', err)
      }
    }
  }
}

/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import { UserWarning } from './UserWarning';
import {
  USER_ID,
  getTodos,
  addTodo,
  deleteTodo,
  updateTodo,
} from './api/todos';
import { Todo } from './types/Todo';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] =
    useState<'all' | 'active' | 'completed'>('all');

  const [newTitle, setNewTitle] = useState('');
  const [tempTodo, setTempTodo] =
    useState<Todo | null>(null);

  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ PRIMEIRO: showError
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 3000);
  };

  // ✅ SEGUNDO: loadTodos
  const loadTodos = async () => {
    try {
      const data = await getTodos();
      setTodos(data);
    } catch {
      showError('Unable to load todos');
    }
  };

  // ✅ AGORA pode usar no useEffect
  useEffect(() => {
    loadTodos();
  }, []);

  // ADD
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = newTitle.trim();

    if (!title) {
      showError('Title should not be empty');
      return;
    }

    const temp: Todo = {
      id: 0,
      userId: USER_ID,
      title,
      completed: false,
    };

    setTempTodo(temp);
    setNewTitle('');

    try {
      const newTodo = await addTodo(title);

      setTodos(prev => [...prev, newTodo]);
      setTempTodo(null);
    } catch {
      showError('Unable to add a todo');
      setTempTodo(null);
    } finally {
      inputRef.current?.focus();
    }
  };

  // DELETE
  const handleDelete = async (id: number) => {
    setLoadingIds(prev => [...prev, id]);

    try {
      await deleteTodo(id);

      setTodos(prev =>
        prev.filter(todo => todo.id !== id),
      );
    } catch {
      showError('Unable to delete a todo');
    } finally {
      setLoadingIds(prev =>
        prev.filter(i => i !== id),
      );
    }
  };

  // TOGGLE
  const handleToggle = async (todo: Todo) => {
    setLoadingIds(prev => [...prev, todo.id]);

    try {
      const updated = await updateTodo({
        ...todo,
        completed: !todo.completed,
      });

      setTodos(prev =>
        prev.map(t =>
          t.id === todo.id ? updated : t,
        ),
      );
    } catch {
      showError('Unable to update a todo');
    } finally {
      setLoadingIds(prev =>
        prev.filter(i => i !== todo.id),
      );
    }
  };

  // CLEAR COMPLETED
  const handleClearCompleted = async () => {
    const completed = todos.filter(t => t.completed);
    const ids = completed.map(t => t.id);

    setLoadingIds(prev => [...prev, ...ids]);

    try {
      await Promise.all(
        completed.map(t => deleteTodo(t.id)),
      );

      setTodos(prev =>
        prev.filter(t => !t.completed),
      );
    } catch {
      showError('Unable to clear completed todos');
    } finally {
      setLoadingIds(prev =>
        prev.filter(id => !ids.includes(id)),
      );
    }
  };

  const visibleTodos = todos.filter(todo => {
    if (status === 'active') return !todo.completed;
    if (status === 'completed') return todo.completed;
    return true;
  });

  const todosToRender = tempTodo
    ? [...visibleTodos, tempTodo]
    : visibleTodos;

  if (!USER_ID) {
    return <UserWarning />;
  }

  const activeCount =
    todos.filter(todo => !todo.completed).length;

  const completedExists =
    todos.some(todo => todo.completed);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={e =>
                setNewTitle(e.target.value)
              }
              disabled={!!tempTodo}
            />
          </form>
        </header>

        {todos.length > 0 && (
          <section className="todoapp__main" data-cy="TodoList">
            {todosToRender.map(todo => {
              const isTemp =
                tempTodo !== null && todo.id === 0;

              const isLoading =
                loadingIds.includes(todo.id);

              return (
                <div
                  key={todo.id || 'temp'}
                  data-cy="Todo"
                  className={classNames('todo', {
                    completed: todo.completed,
                  })}
                >
                  <label className="todo__status-label">
                    <input
                      data-cy="TodoStatus"
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() =>
                        handleToggle(todo)
                      }
                      disabled={isLoading}
                    />
                  </label>

                  <span data-cy="TodoTitle">
                    {todo.title}
                  </span>

                  <button
                    data-cy="TodoDelete"
                    onClick={() =>
                      handleDelete(todo.id)
                    }
                    disabled={isLoading}
                  >
                    ×
                  </button>

                  <div
                    data-cy="TodoLoader"
                    className={classNames(
                      'modal overlay',
                      {
                        'is-active':
                          isTemp || isLoading,
                      },
                    )}
                  >
                    <div className="modal-background" />
                    <div className="loader" />
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {todos.length > 0 && (
          <footer data-cy="Footer">
            <span data-cy="TodosCounter">
              {activeCount} items left
            </span>

            <nav data-cy="Filter">
              <a
                data-cy="FilterLinkAll"
                onClick={() => setStatus('all')}
              >
                All
              </a>

              <a
                data-cy="FilterLinkActive"
                onClick={() => setStatus('active')}
              >
                Active
              </a>

              <a
                data-cy="FilterLinkCompleted"
                onClick={() => setStatus('completed')}
              >
                Completed
              </a>
            </nav>

            {completedExists && (
              <button
                data-cy="ClearCompletedButton"
                onClick={handleClearCompleted}
              >
                Clear completed
              </button>
            )}
          </footer>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames('notification', {
          hidden: !error,
        })}
      >
        <button onClick={() => setError('')}>
          ×
        </button>
        {error}
      </div>
    </div>
  );
};
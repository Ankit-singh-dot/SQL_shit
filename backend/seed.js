const mongoose = require('mongoose');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const Assignment = require('./models/Assignment');

dotenv.config();

const assignments = [
    {
        title: 'Select All Employees',
        description: 'Write a query to retrieve all records from the employees table.',
        difficulty: 'Easy',
        tables: [
            {
                tableName: 'employees',
                columns: [
                    { name: 'id', type: 'INTEGER' },
                    { name: 'name', type: 'VARCHAR' },
                    { name: 'department', type: 'VARCHAR' },
                    { name: 'salary', type: 'INTEGER' },
                    { name: 'hire_date', type: 'DATE' },
                ],
                sampleData: [
                    [1, 'Alice Johnson', 'Engineering', 85000, '2020-01-15'],
                    [2, 'Bob Smith', 'Marketing', 65000, '2019-06-20'],
                    [3, 'Charlie Brown', 'Engineering', 92000, '2018-03-10'],
                    [4, 'Diana Ross', 'HR', 70000, '2021-09-01'],
                    [5, 'Eve Davis', 'Marketing', 60000, '2022-02-14'],
                ],
            },
        ],
        expectedQuery: 'SELECT * FROM employees;',
        hints: ['Think about which SQL keyword selects data', 'The asterisk (*) can be useful'],
    },
    {
        title: 'Filter by Department',
        description: 'Write a query to find all employees who work in the Engineering department.',
        difficulty: 'Easy',
        tables: [
            {
                tableName: 'employees',
                columns: [
                    { name: 'id', type: 'INTEGER' },
                    { name: 'name', type: 'VARCHAR' },
                    { name: 'department', type: 'VARCHAR' },
                    { name: 'salary', type: 'INTEGER' },
                    { name: 'hire_date', type: 'DATE' },
                ],
                sampleData: [
                    [1, 'Alice Johnson', 'Engineering', 85000, '2020-01-15'],
                    [2, 'Bob Smith', 'Marketing', 65000, '2019-06-20'],
                    [3, 'Charlie Brown', 'Engineering', 92000, '2018-03-10'],
                    [4, 'Diana Ross', 'HR', 70000, '2021-09-01'],
                    [5, 'Eve Davis', 'Marketing', 60000, '2022-02-14'],
                ],
            },
        ],
        expectedQuery: "SELECT * FROM employees WHERE department = 'Engineering';",
        hints: ['Use the WHERE clause to filter results', 'String values need to be in quotes'],
    },
    {
        title: 'Calculate Average Salary',
        description: 'Write a query to calculate the average salary of all employees.',
        difficulty: 'Medium',
        tables: [
            {
                tableName: 'employees',
                columns: [
                    { name: 'id', type: 'INTEGER' },
                    { name: 'name', type: 'VARCHAR' },
                    { name: 'department', type: 'VARCHAR' },
                    { name: 'salary', type: 'INTEGER' },
                    { name: 'hire_date', type: 'DATE' },
                ],
                sampleData: [
                    [1, 'Alice Johnson', 'Engineering', 85000, '2020-01-15'],
                    [2, 'Bob Smith', 'Marketing', 65000, '2019-06-20'],
                    [3, 'Charlie Brown', 'Engineering', 92000, '2018-03-10'],
                    [4, 'Diana Ross', 'HR', 70000, '2021-09-01'],
                    [5, 'Eve Davis', 'Marketing', 60000, '2022-02-14'],
                ],
            },
        ],
        expectedQuery: 'SELECT AVG(salary) FROM employees;',
        hints: ['SQL has aggregate functions for calculations', 'Look into the AVG() function'],
    },
    {
        title: 'Join Orders and Customers',
        description: 'Write a query to display all orders along with the customer name who placed them. Show customer_name, product, and amount.',
        difficulty: 'Medium',
        tables: [
            {
                tableName: 'customers',
                columns: [
                    { name: 'id', type: 'INTEGER' },
                    { name: 'customer_name', type: 'VARCHAR' },
                    { name: 'city', type: 'VARCHAR' },
                ],
                sampleData: [
                    [1, 'John Doe', 'New York'],
                    [2, 'Jane Smith', 'Los Angeles'],
                    [3, 'Mike Wilson', 'Chicago'],
                ],
            },
            {
                tableName: 'orders',
                columns: [
                    { name: 'id', type: 'INTEGER' },
                    { name: 'customer_id', type: 'INTEGER' },
                    { name: 'product', type: 'VARCHAR' },
                    { name: 'amount', type: 'INTEGER' },
                    { name: 'order_date', type: 'DATE' },
                ],
                sampleData: [
                    [1, 1, 'Laptop', 1200, '2024-01-15'],
                    [2, 2, 'Phone', 800, '2024-02-20'],
                    [3, 1, 'Tablet', 500, '2024-03-10'],
                    [4, 3, 'Monitor', 350, '2024-01-25'],
                    [5, 2, 'Keyboard', 100, '2024-04-05'],
                ],
            },
        ],
        expectedQuery: 'SELECT c.customer_name, o.product, o.amount FROM orders o JOIN customers c ON o.customer_id = c.id;',
        hints: ['You need to combine data from two tables', 'Look into JOIN and ON clauses'],
    },
    {
        title: 'Group By with Having',
        description: 'Write a query to find departments that have an average salary greater than 70000. Show the department name and average salary.',
        difficulty: 'Hard',
        tables: [
            {
                tableName: 'employees',
                columns: [
                    { name: 'id', type: 'INTEGER' },
                    { name: 'name', type: 'VARCHAR' },
                    { name: 'department', type: 'VARCHAR' },
                    { name: 'salary', type: 'INTEGER' },
                    { name: 'hire_date', type: 'DATE' },
                ],
                sampleData: [
                    [1, 'Alice Johnson', 'Engineering', 85000, '2020-01-15'],
                    [2, 'Bob Smith', 'Marketing', 65000, '2019-06-20'],
                    [3, 'Charlie Brown', 'Engineering', 92000, '2018-03-10'],
                    [4, 'Diana Ross', 'HR', 70000, '2021-09-01'],
                    [5, 'Eve Davis', 'Marketing', 60000, '2022-02-14'],
                    [6, 'Frank Miller', 'Engineering', 78000, '2020-07-15'],
                    [7, 'Grace Lee', 'HR', 72000, '2019-11-30'],
                ],
            },
        ],
        expectedQuery: "SELECT department, AVG(salary) as avg_salary FROM employees GROUP BY department HAVING AVG(salary) > 70000;",
        hints: ['GROUP BY groups rows that share a value', 'HAVING is like WHERE but for grouped results'],
    },
    {
        title: 'Subquery — Above Average Earners',
        description: 'Write a query to find all employees whose salary is above the company average salary.',
        difficulty: 'Hard',
        tables: [
            {
                tableName: 'employees',
                columns: [
                    { name: 'id', type: 'INTEGER' },
                    { name: 'name', type: 'VARCHAR' },
                    { name: 'department', type: 'VARCHAR' },
                    { name: 'salary', type: 'INTEGER' },
                    { name: 'hire_date', type: 'DATE' },
                ],
                sampleData: [
                    [1, 'Alice Johnson', 'Engineering', 85000, '2020-01-15'],
                    [2, 'Bob Smith', 'Marketing', 65000, '2019-06-20'],
                    [3, 'Charlie Brown', 'Engineering', 92000, '2018-03-10'],
                    [4, 'Diana Ross', 'HR', 70000, '2021-09-01'],
                    [5, 'Eve Davis', 'Marketing', 60000, '2022-02-14'],
                ],
            },
        ],
        expectedQuery: 'SELECT * FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
        hints: ['You can nest a SELECT inside another SELECT', 'First figure out how to get the average, then use it as a filter'],
    },
];

const pgSetupSQL = `
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  salary INTEGER NOT NULL,
  hire_date DATE NOT NULL
);

INSERT INTO employees (name, department, salary, hire_date) VALUES
  ('Alice Johnson', 'Engineering', 85000, '2020-01-15'),
  ('Bob Smith', 'Marketing', 65000, '2019-06-20'),
  ('Charlie Brown', 'Engineering', 92000, '2018-03-10'),
  ('Diana Ross', 'HR', 70000, '2021-09-01'),
  ('Eve Davis', 'Marketing', 60000, '2022-02-14'),
  ('Frank Miller', 'Engineering', 78000, '2020-07-15'),
  ('Grace Lee', 'HR', 72000, '2019-11-30');

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL
);

INSERT INTO customers (customer_name, city) VALUES
  ('John Doe', 'New York'),
  ('Jane Smith', 'Los Angeles'),
  ('Mike Wilson', 'Chicago');

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  product VARCHAR(100) NOT NULL,
  amount INTEGER NOT NULL,
  order_date DATE NOT NULL
);

INSERT INTO orders (customer_id, product, amount, order_date) VALUES
  (1, 'Laptop', 1200, '2024-01-15'),
  (2, 'Phone', 800, '2024-02-20'),
  (1, 'Tablet', 500, '2024-03-10'),
  (3, 'Monitor', 350, '2024-01-25'),
  (2, 'Keyboard', 100, '2024-04-05');
`;

const seed = async () => {
    try {
        // Connect MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        // Clear and seed assignments
        await Assignment.deleteMany({});
        await Assignment.insertMany(assignments);
        console.log(`Seeded ${assignments.length} assignments into MongoDB`);

        // Connect PostgreSQL and create tables
        const pool = new Pool({ connectionString: process.env.PG_URI });
        await pool.query(pgSetupSQL);
        console.log('PostgreSQL tables created and seeded');

        await pool.end();
        await mongoose.disconnect();
        console.log('Seed complete!');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err.message);
        process.exit(1);
    }
};

seed();

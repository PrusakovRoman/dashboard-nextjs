import bcrypt from 'bcrypt';
import { db } from '@vercel/postgres'; // Измените на этот импорт
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

async function seedUsers(client: any) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Создаем таблицу пользователей
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `;

    console.log(`Created "users" table`);

    // Вставляем пользователей по одному
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await client.sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    console.log(`Seeded ${users.length} users`);

    return {
      createTable,
      users: users,
    };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

async function seedCustomers(client: any) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      );
    `;

    console.log(`Created "customers" table`);

    // Вставляем клиентов по одному
    for (const customer of customers) {
      await client.sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    console.log(`Seeded ${customers.length} customers`);

    return {
      createTable,
      customers: customers,
    };
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

async function seedInvoices(client: any) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        customer_id UUID NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      );
    `;

    console.log(`Created "invoices" table`);

    // Вставляем счета по одному
    for (const invoice of invoices) {
      await client.sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    console.log(`Seeded ${invoices.length} invoices`);

    return {
      createTable,
      invoices: invoices,
    };
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }
}

async function seedRevenue(client: any) {
  try {
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      );
    `;

    console.log(`Created "revenue" table`);

    // Вставляем данные о доходах по одному
    for (const rev of revenue) {
      await client.sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `;
    }

    console.log(`Seeded ${revenue.length} revenue records`);

    return {
      createTable,
      revenue: revenue,
    };
  } catch (error) {
    console.error('Error seeding revenue:', error);
    throw error;
  }
}

export async function GET() {
  try {
    console.log('Starting database seed...');

    const client = await db.connect();

    // Выполняем последовательно, а не параллельно
    console.log('Seeding users...');
    await seedUsers(client);

    console.log('Seeding customers...');
    await seedCustomers(client);

    console.log('Seeding invoices...');
    await seedInvoices(client);

    console.log('Seeding revenue...');
    await seedRevenue(client);

    await client.end();

    console.log('Database seeded successfully!');

    return Response.json({
      message: 'Database seeded successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error during seeding:', error);

    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, {
      status: 500
    });
  }
}
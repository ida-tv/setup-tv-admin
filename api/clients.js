import { db } from '@vercel/postgres';

export default async function handler(req, res) {
  // Настройка разрешений, чтобы данные могли приходить извне
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = await db.connect();

  // --- ПОЛУЧЕНИЕ ДАННЫХ ОТ GOOGLE ТАБЛИЦЫ ---
  if (req.method === 'POST') {
    const { name, address, phone, nick, email, arve_nr, amount, status } = req.body;
    
    try {
      await client.sql`
        INSERT INTO clients (name, address, phone, nick, email, arve_nr, amount, status)
        VALUES (${name}, ${address}, ${phone}, ${nick}, ${email}, ${arve_nr}, ${amount}, ${status})
        ON CONFLICT (nick) 
        DO UPDATE SET 
          status = ${status}, 
          amount = ${amount},
          updated_at = CURRENT_TIMESTAMP;
      `;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // --- ОТДАЧА ДАННЫХ НА ВАШ САЙТ ---
  if (req.method === 'GET') {
    try {
      const { rows } = await client.sql`SELECT * FROM clients ORDER BY updated_at DESC`;
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(500).json({ error: 'Database error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

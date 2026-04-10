import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Настройка доступа (чтобы таблица могла присылать данные)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ссылка на вашу базу данных MongoDB (берется из настроек Vercel)
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('iptv_db'); // Название вашей базы
    const collection = db.collection('clients');

    // Если сайт просто открывается (запрос данных)
    if (req.method === 'GET') {
      const clients = await collection.find({}).toArray();
      return res.status(200).json(clients);
    }

    // Если пришел сигнал из таблицы (обновление статуса)
    if (req.method === 'POST') {
      const { nick, status, price, renewalDate } = req.body;

      if (!nick) {
        return res.status(400).json({ error: 'Ник не передан' });
      }

      // Находим клиента по Нику и обновляем его Статус, Цену и Дату
      await collection.updateOne(
        { nick: nick.trim() },
        { 
          $set: { 
            status: status, 
            price: price, 
            renewalDate: renewalDate,
            lastUpdate: new Date() 
          } 
        },
        { upsert: true } // Если клиента нет — создаст нового
      );

      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}

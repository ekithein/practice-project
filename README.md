Это простое CRUD веб-приложение, которое представляет личный кабинет агента для управления объявлениями по продаже объектов недвижимости с базовой функциональностью

## Стек технологий
Языки и технологии:
- **Backend**: Python 3.11+, Flask
- **Frontend**: HTML5, CSS3, JavaScript ES6
- **База данных**: PostgreSQL
Библиотеки:
- **openpyxl + pandas**: экспорт данных в формате xlsx
- **python-dotenv**: загрузка конфигурации из .env
- **psycopg2-binary**: работа с PostgreSQL
- **werkzeug.security**: хеширование паролей
- **Font Awesome 6**: иконки для кнопок и интерфейса
- **Chart.js**: визуализация аналитики в виде графиков

## Как развернуть проект у себя
Для начала убедитесь, что у вас установлены:
- Python 3.11+
- PostgreSQL
- Git
### 1. Клонирование проекта
```bash
git clone https://github.com/ekithein/practice-project.git
cd practice-project
```

### 2. Создание и активация виртуального окружения
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
```
Если не сработало, попробуйте:
```bash
python -m venv venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```
Так как Windows PowerShell по умолчанию настроен на политику безопасности Restricted, которая запрещает выполнение любых .ps1-файлов (скриптов)
### 3. Установка зависимостей
```bash
pip install -r requirements.txt
```

### 4. Настройка переменных окружения
Скопируйте `.env.example` в `.env`, в будущем вам нужно будет заполнить параметры подключения к БД:
```bash
DB_NAME=your_db
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=your_secret
```
Значения переменных загружаются с помощью `python-dotenv` внутри `app.py` и `add_user.py`.

### 5. Подготовка базы данных
Создайте таблицы, описанные в схеме. Это можно сделать самостоятельно, ориентируясь на ERD-диаграмму БД:
![database_scheme_readme](https://github.com/user-attachments/assets/74d19cb4-20e1-4d19-ae2d-71a6687ddb88)
или с помощью следующего `psql` скрипта:
```sql
-- users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL
);

-- listings
CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('активен', 'скрыт', 'продано')) DEFAULT 'активен',
    type TEXT CHECK (type IN ('квартира', 'дом')) NOT NULL,
    area INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- квартира
CREATE TABLE apartment_details (
    listing_id INTEGER PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
    rooms INTEGER,
    floor INTEGER
);

-- дом
CREATE TABLE house_details (
    listing_id INTEGER PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
    floors INTEGER,
    plot_size INTEGER
);
```
## 6. Добавление пользователя
После запуска необходимо создать пользователя через этот скрипт либо через БД, иначе вход будет невозможен

Самый простой вариант для добавления учетной записи это выполнение специального скрипта. Для этого введите данные:
```bash
python add_user.py
```

## 7. Запуск приложения
```bash
python app.py
```
После запуска откройте в браузере: http://127.0.0.1:5000 на странице логина войдите по указанным на предыдущем шаге логину и паролю

## 8. Добавление объявлений
Объявления можно добавить вручную с помощью UI на главной странице, но если хочется сразу протестировать работу веб-приложения, выполните данный `psql` скрипт, который добавляет 12 объектов недвижимости:
``` SQL
-- Квартиры
INSERT INTO listings (user_id, title, type, city, price, status, description, address, area, created_at)
VALUES
(1, 'Квартира в центре', 'квартира', 'Москва', 9500000, 'активен', 'Рядом метро и парк', 'Тверская 5', 45, now()),
(1, 'Уютная студия', 'квартира', 'Санкт-Петербург', 4800000, 'скрыт', 'Идеальна для одного человека', 'Невский 25', 32, now()),
(1, 'Квартира с ремонтом', 'квартира', 'Казань', 7800000, 'продано', 'Ремонт и мебель включены', 'Баумана 8', 55, now()),
(1, 'Двушка в новостройке', 'квартира', 'Екатеринбург', 6200000, 'активен', 'ЖК "Северный"', 'Ленина 22', 58, now());

-- Детали по квартирам
INSERT INTO apartment_details (listing_id, rooms, floor)
VALUES
((SELECT id FROM listings WHERE title = 'Квартира в центре'), 2, 3),
((SELECT id FROM listings WHERE title = 'Уютная студия'), 1, 5),
((SELECT id FROM listings WHERE title = 'Квартира с ремонтом'), 2, 7),
((SELECT id FROM listings WHERE title = 'Двушка в новостройке'), 2, 9);

-- Дома
INSERT INTO listings (user_id, title, type, city, price, status, description, address, area, created_at)
VALUES
(1, 'Дом у озера', 'дом', 'Сочи', 17300000, 'активен', 'Потрясающий вид на воду', 'Береговая 3', 180, now()),
(1, 'Коттедж в Подмосковье', 'дом', 'Химки', 12500000, 'скрыт', 'Участок 10 соток, рядом школа', 'Садовая 11', 140, now()),
(1, 'Дом для большой семьи', 'дом', 'Тула', 8900000, 'продано', '5 комнат, гараж, баня', 'Южная 14', 160, now()),
(1, 'Таунхаус в пригороде', 'дом', 'Нижний Новгород', 7300000, 'активен', 'Новый дом в коттеджном поселке', 'Речная 7', 120, now());

-- Детали по домам
INSERT INTO house_details (listing_id, floors, plot_size)
VALUES
((SELECT id FROM listings WHERE title = 'Дом у озера'), 2, 8),
((SELECT id FROM listings WHERE title = 'Коттедж в Подмосковье'), 2, 10),
((SELECT id FROM listings WHERE title = 'Дом для большой семьи'), 2, 6),
((SELECT id FROM listings WHERE title = 'Таунхаус в пригороде'), 2, 4);

-- Дополнительные записи, смешанные типы
INSERT INTO listings (user_id, title, type, city, price, status, description, address, area, created_at)
VALUES
(1, 'Студия на юге', 'квартира', 'Ростов-на-Дону', 3600000, 'активен', 'Для сдачи в аренду', 'Зеленая 9', 28, now()),
(1, 'Дача с участком', 'дом', 'Тверь', 4900000, 'активен', 'Участок 12 соток', 'Полевая 17', 100, now());

INSERT INTO apartment_details (listing_id, rooms, floor)
VALUES
((SELECT id FROM listings WHERE title = 'Студия на юге'), 1, 4);

INSERT INTO house_details (listing_id, floors, plot_size)
VALUES
((SELECT id FROM listings WHERE title = 'Дача с участком'), 1, 12);
```
Если скрипт не работает, проверьте, с каким `id` добавился ваш `user` и если это не 1, то поменяйте его на тот, который указан в вашем случае
## Функциональность сайта
Главная страница (Личный кабинет):
- Просмотр, добавление, редактирование и удаление объявлений
- Поиск по названию объявления
- Множественная фильтрация по:
    - Общим параметрам: город, цена, тип объекта, статус
    - Специфическим характеристикам:
        - Квартиры: площадь, этаж, количество комнат
        - Дома: площадь, участок (сотки), этажность
 Страница аналитики:
- HERO-панель с базовой статистикой:
    - Общее количество объявлений
    - Средняя цена
    - Топ-3 города по количеству объявлений
- Визуализация данных:
    - Столбчатая диаграмма — количество объявлений по статусам
    - Столбчатая диаграмма — количество объявлений в топ-3 городах
    - Круговая диаграмма — распределение общей стоимости проданных/непроданных объектов
    - Гистограмма — распределение объявлений по ценовым диапазонам
Настройки:
- Экспорт данных в формате `.xlsx` (для дальнейшего анализа в Excel или Python/pandas)
- Выход из аккаунта (перенаправление на форму авторизации)
## Структура проекта
```bash 
practice-project/  
├── routes/ # Маршруты Flask  
├── static/ # Статические файлы (JS, CSS)  
├── templates/ # HTML-шаблоны Jinja2  
├── utils/ # Утилиты и вспомогательные функции  
├── app.py # Точка входа  
├── db.py # Работа с базой  
├── add_user.py # Скрипт создания пользователя  
├── .env.example # Пример .env для заполнения
├── requirements.txt # Зависимости
```

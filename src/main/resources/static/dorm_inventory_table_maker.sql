-- start here:

-- psql

CREATE DATABASE dorm_pantry;



-- 1. Connect to the existing database

\c dorm_pantry



-- 2. Drop the old table (to clear out the generic data and start fresh)

DROP TABLE IF EXISTS food_inventory;



-- 3. Re-create the table with the same structure (best for Spring Boot)

CREATE TABLE food_inventory (

    id SERIAL PRIMARY KEY,

    item_name VARCHAR(100),

    category VARCHAR(50),

    quantity INTEGER,

    price DECIMAL(10, 2),

    expiry_date DATE

);



-- 4. Copy the NEW csv file over to postgres

-- REPLACE below with the actual full path to your new CSV file!

\COPY food_inventory(item_name, category, quantity, price, expiry_date) FROM 'C:\Users\Pranavsai.Gandikota\Documents\SpringStuff\premzone\src\main\resources\static\dorm_inventory.csv' DELIMITER ',' CSV HEADER;



-- 5. Confirm the table was populated with the new company names

SELECT * FROM food_inventory;
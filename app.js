const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
});

const Product = sequelize.define('Product', {
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
});

const Category = sequelize.define('Category', {
    name: { type: DataTypes.STRING, allowNull: false },
});

const Supplier = sequelize.define('Supplier', {
    name: { type: DataTypes.STRING, allowNull: false },
    contact: { type: DataTypes.STRING },
});

Product.belongsTo(Category);
Product.belongsTo(Supplier);
Category.hasMany(Product);
Supplier.hasMany(Product);

app.get('/', async (req, res) => {
    try {
        const products = await Product.findAll({
            include: [Category, Supplier],
        });
        res.render('index', { products });
    } catch (error) {
        console.error('Ошибка при получении продуктов:', error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
});

app.get('/add-category', (req, res) => {
    res.render('add-category');
});

app.get('/add-supplier', (req, res) => {
    res.render('add-supplier');
});

app.get('/add-product', async (req, res) => {
    try {
        const categories = await Category.findAll();
        const suppliers = await Supplier.findAll();
        res.render('add-product', { categories, suppliers });
    } catch (error) {
        console.error('Ошибка при получении категорий или поставщиков:', error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
});

app.get('/edit-product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findByPk(productId, {
            include: [Category, Supplier],
        });
        const categories = await Category.findAll();
        const suppliers = await Supplier.findAll();
        res.render('edit-product', { product, categories, suppliers });
    } catch (error) {
        console.error('Ошибка при получении продукта для редактирования:', error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
});

app.post('/add-category', async (req, res) => {
    try {
        const { name } = req.body;
        if (name) {
            await Category.create({ name });
        }
        res.redirect('/');
    } catch (error) {
        console.error('Ошибка при добавлении категории:', error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
});

app.post('/add-supplier', async (req, res) => {
    try {
        const { name, contact } = req.body;
        if (name) {
            await Supplier.create({ name, contact });
        }
        res.redirect('/');
    } catch (error) {
        console.error('Ошибка при добавлении поставщика:', error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
});

app.post('/add-product', async (req, res) => {
    try {
        const { name, price, categoryId, supplierId } = req.body;

        if (name && price && categoryId && supplierId) {
            await Product.create({ 
                name, 
                price, 
                CategoryId: categoryId, 
                SupplierId: supplierId 
            });
            res.redirect('/');
        } else {
            res.status(400).send('Все поля обязательны для заполнения');
        }
    } catch (error) {
        console.error('Ошибка при добавлении продукта:', error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
});

app.post('/delete-product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        await Product.destroy({
            where: { id: productId },
        });
        res.redirect('/');
    } catch (error) {
        console.error('Ошибка при удалении продукта:', error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
});

app.post('/edit-product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, price, categoryId, supplierId } = req.body;

        await Product.update(
            { name, price, CategoryId: categoryId, SupplierId: supplierId },
            { where: { id: productId } }
        );
        res.redirect('/');
    } catch (error) {
        console.error('Ошибка при обновлении продукта:', error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
});

(async () => {
    try {
        await sequelize.sync(); 

        const category1 = await Category.create({ name: 'Электроника' });
        const category2 = await Category.create({ name: 'Книги' });

        const supplier1 = await Supplier.create({ 
            name: 'TechCorp', 
            contact: 'techcorp@example.com' 
        });
        const supplier2 = await Supplier.create({ 
            name: 'BookStore', 
            contact: 'contact@bookstore.com' 
        });

        await Product.create({ 
            name: 'Ноутбук', 
            price: 1200.99, 
            CategoryId: category1.id, 
            SupplierId: supplier1.id 
        });

        await Product.create({ 
            name: 'Смартфон', 
            price: 799.49, 
            CategoryId: category1.id, 
            SupplierId: supplier1.id 
        });

        await Product.create({ 
            name: 'Книга по программированию', 
            price: 29.99, 
            CategoryId: category2.id, 
            SupplierId: supplier2.id 
        });

        console.log('База данных синхронизирована и тестовые данные созданы!');
        
        app.listen(PORT, () => {
            console.log(`Сервер запущен на http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Ошибка при инициализации приложения:', error);
    }
})();

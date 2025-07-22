import DBClient from "#src/tests/mocks/DBClient.mock.js"
import { ProductDAO } from "#src/core/data/ProductDao.js"
import { validProduct, invalidProducts } from "#src/tests/fixtures/ProductData.js"

describe('[Product - DAO]', function () {
    let dbClient, productDAO;

    beforeEach(function () {
        dbClient = new DBClient();
        productDAO = new ProductDAO(dbClient);
    });

    describe('validateProduct', function () {
        test('Accepte un produit valide', function () {
            // Arrange
            const product = validProduct;

            // Act & Assert
            expect(() => productDAO.validateProduct(product)).not.toThrow();
        });

        describe('Refuser un produit invalide - validation des valeurs', function () {
            test('Rejette un produit avec un prix invalide', function () {
                // Arrange
                const productWithInvalidPrice = invalidProducts.invalidPrice;

                // Act & Assert
                expect(() => productDAO.validateProduct(productWithInvalidPrice))
                    .toThrow('Le champ price doit être ≥ 0');
            });

            test('Rejette un produit avec un stock invalide', function () {
                // Arrange
                const productWithInvalidStock = invalidProducts.invalidStock;

                // Act & Assert
                expect(() => productDAO.validateProduct(productWithInvalidStock))
                    .toThrow('Le champ stock doit être ≥ 0');
            });

            test('Rejette un produit avec une description trop courte', function () {
                // Arrange
                const productWithShortDescription = invalidProducts.shortDescription;

                // Act & Assert
                expect(() => productDAO.validateProduct(productWithShortDescription))
                    .toThrow('Le champ description doit contenir au moins 10 caractères');
            });

            test('Rejette un produit avec un nom trop court', function () {
                // Arrange
                const productWithShortName = invalidProducts.shortName;

                // Act & Assert
                expect(() => productDAO.validateProduct(productWithShortName))
                    .toThrow('Le champ name doit contenir au moins 5 caractères');
            });
        });

        describe('Refuser un produit invalide - champs obligatoires', function () {
            test('Rejette un produit avec un prix null', function () {
                // Arrange
                const productWithNullPrice = Object.assign({}, invalidProducts.invalidPrice, {
                    price: null
                });

                // Act & Assert
                expect(() => productDAO.validateProduct(productWithNullPrice))
                    .toThrow('Le champ price est obligatoire');
            });

            test('Rejette un produit avec un stock null', function () {
                // Arrange
                const productWithNullStock = Object.assign({}, invalidProducts.invalidStock, {
                    stock: null
                });

                // Act & Assert
                expect(() => productDAO.validateProduct(productWithNullStock))
                    .toThrow('Le champ stock est obligatoire');
            });

            test('Rejette un produit avec un nom null', function () {
                // Arrange
                const productWithNullName = Object.assign({}, invalidProducts.shortName, {
                    name: null
                });

                // Act & Assert
                expect(() => productDAO.validateProduct(productWithNullName))
                    .toThrow('Le champ name est obligatoire');
            });

            test('Rejette un produit avec une description null', function () {
                // Arrange
                const productWithNullDescription = Object.assign({}, invalidProducts.shortDescription, {
                    description: null
                });

                // Act & Assert
                expect(() => productDAO.validateProduct(productWithNullDescription))
                    .toThrow('Le champ description est obligatoire');
            });
        });

        describe('Refuser un produit invalide - types incorrects', function () {
            test('Rejette un produit avec un prix de mauvais type', function () {
                // Arrange
                const productWithWrongPriceType = Object.assign({}, invalidProducts.invalidPrice, {
                    price: true
                });

                // Act & Assert
                expect(() => productDAO.validateProduct(productWithWrongPriceType))
                    .toThrow('Le champ price doit être de type number');
            });

            test('Rejette un produit avec un stock non entier', function () {
                // Arrange
                const productWithFloatStock = Object.assign({}, invalidProducts.invalidStock, {
                    stock: 125.2
                });

                // Act & Assert
                expect(() => productDAO.validateProduct(productWithFloatStock))
                    .toThrow('Le champ stock doit être un entier');
            });

            test('Rejette un produit avec un nom de mauvais type', function () {
                // Arrange
                const productWithWrongNameType = Object.assign({}, invalidProducts.shortName, {
                    name: 123
                });

                // Act & Assert
                expect(() => productDAO.validateProduct(productWithWrongNameType))
                    .toThrow('Le champ name doit être de type string');
            });

            test('Rejette un produit avec une description de mauvais type', function () {
                // Arrange
                const productWithWrongDescriptionType = Object.assign({}, invalidProducts.shortDescription, {
                    description: false
                });

                // Act & Assert
                expect(() => productDAO.validateProduct(productWithWrongDescriptionType))
                    .toThrow('Le champ description doit être de type string');
            });
        });
    });

    describe('create', function () {

        test('Crée un produit avec succès', async function () {
            // Arrange
            const product = validProduct;

            // Act
            const result = await productDAO.create(product);

            // Assert
            expect(result.insertId).toBe(1);
        });
        
        test("DB error simulated", async () => {
            dbClient.failNext(); // La prochaine query lèvera une erreur simulée
    
            // Act & Assert
            await expect(productDAO.create(validProduct)).rejects.toThrow("DB error simulated");
    
    
            // Vérification supplémentaire (si transaction mockée avec historique)
            // Ici tu pourrais vérifier que la transaction s'est bien déroulée côté mock,
            // par exemple en contrôlant un 'rollbackCalled' ou l'absence de commit.
            // (Selon l’implémentation de ton DBClient/mock)
        });
    });

});
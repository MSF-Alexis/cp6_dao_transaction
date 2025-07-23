import DBClient from "#src/tests/mocks/DBClient.mock.js";
import { ProductDAO } from "#src/core/data/ProductDao.js";
import { validProduct, invalidProducts, mockProducts } from "#src/tests/fixtures/ProductData.js";

describe("[Product - DAO]", () => {
    let dbClient, productDAO;

    beforeEach(() => {
        dbClient = new DBClient();
        productDAO = new ProductDAO(dbClient);
    });

    /* ------------------------------------------------------------------ */
    /* validateProduct() – Phase 1 : Tests SIMPLES                        */
    /* ------------------------------------------------------------------ */
    describe("validateProduct()", () => {
        test("Test 1 - Accepte un produit valide", () => {
            expect(() => productDAO.validateProduct(validProduct)).not.toThrow();
        });

        /* -------- Validation des valeurs (Tests 2→5) -------- */
        describe("Test 2→5 - Rejette un produit invalide (valeurs hors plage)", () => {
            test("Test 4 - Rejette un produit avec un prix invalide", () => {
                expect(() =>
                    productDAO.validateProduct(invalidProducts.invalidPrice)
                ).toThrow("Le champ price doit être ≥ 0");
            });

            test("Test 5 - Rejette un produit avec un stock invalide", () => {
                expect(() =>
                    productDAO.validateProduct(invalidProducts.invalidStock)
                ).toThrow("Le champ stock doit être ≥ 0");
            });

            test("Test 3 - Rejette un produit avec une description trop courte", () => {
                expect(() =>
                    productDAO.validateProduct(invalidProducts.shortDescription)
                ).toThrow(
                    "Le champ description doit contenir au moins 10 caractères"
                );
            });

            test("Test 2 - Rejette un produit avec un nom trop court", () => {
                expect(() =>
                    productDAO.validateProduct(invalidProducts.shortName)
                ).toThrow("Le champ name doit contenir au moins 5 caractères");
            });
        });

        /* -------- Champs obligatoires (Test 52) -------- */
        describe("Test 52 - Rejette un produit invalide (champs obligatoires)", () => {
            test("Rejette un produit avec un prix null", () => {
                const p = { ...invalidProducts.invalidPrice, price: null };
                expect(() => productDAO.validateProduct(p)).toThrow(
                    "Le champ price est obligatoire"
                );
            });

            test("Rejette un produit avec un stock null", () => {
                const p = { ...invalidProducts.invalidStock, stock: null };
                expect(() => productDAO.validateProduct(p)).toThrow(
                    "Le champ stock est obligatoire"
                );
            });

            test("Rejette un produit avec un nom null", () => {
                const p = { ...invalidProducts.shortName, name: null };
                expect(() => productDAO.validateProduct(p)).toThrow(
                    "Le champ name est obligatoire"
                );
            });

            test("Rejette un produit avec une description null", () => {
                const p = { ...invalidProducts.shortDescription, description: null };
                expect(() => productDAO.validateProduct(p)).toThrow(
                    "Le champ description est obligatoire"
                );
            });
        });

        /* -------- Types incorrects (Tests 53 & 54) -------- */
        describe("Tests 53-54 - Rejette un produit invalide (types incorrects)", () => {
            test("Test 53 - Rejette un produit avec un prix de mauvais type", () => {
                const p = { ...invalidProducts.invalidPrice, price: true };
                expect(() => productDAO.validateProduct(p)).toThrow(
                    "Le champ price doit être de type number"
                );
            });

            test("Test 54 - Rejette un produit avec un stock non entier", () => {
                const p = { ...invalidProducts.invalidStock, stock: 125.2 };
                expect(() => productDAO.validateProduct(p)).toThrow(
                    "Le champ stock doit être un entier"
                );
            });

            test("Test 53 - Rejette un produit avec un nom de mauvais type", () => {
                const p = { ...invalidProducts.shortName, name: 123 };
                expect(() => productDAO.validateProduct(p)).toThrow(
                    "Le champ name doit être de type string"
                );
            });

            test("Test 53 - Rejette un produit avec une description de mauvais type", () => {
                const p = { ...invalidProducts.shortDescription, description: false };
                expect(() => productDAO.validateProduct(p)).toThrow(
                    "Le champ description doit être de type string"
                );
            });
        });
    });

    /* ------------------------------------------------------------------ */
    /* create() – Phase 1 & 2                                             */
    /* ------------------------------------------------------------------ */
    describe("create()", () => {
        test("Test 6 - Crée un produit avec succès", async () => {
            const result = await productDAO.create(validProduct);
            expect(result.insertId).toBe(1);
        });

        test("Test 55 - Effectue rollback en cas d'erreur de base de données", async () => {
            dbClient.failNext();
            await expect(productDAO.create(validProduct)).rejects.toThrow(
                "DB error simulated"
            );
        });

        test("Test 7 - Rejette un produit invalide avant transaction", async () => {
            await expect(productDAO.create(invalidProducts.shortName)).rejects.toThrow(
                "Le champ name doit contenir au moins 5 caractères"
            );
            expect(dbClient.queries).toHaveLength(0);
        });
    });

    /* ------------------------------------------------------------------ */
    /*  Les autres blocs (findAll, findById, etc.) sont encore À FAIRE    */
    /* ------------------------------------------------------------------ */

    describe("findAll()", function () {
        // Test 8 – Retourne tous les produits avec pagination par défaut
        test('Test 8 – Retourne tous les produits avec pagination par défaut', async () => {
            // 1. ARRANGE
            // On "mock" la méthode query du dbClient pour simuler deux accès BDD :
            // - Premier appel de query (pour le total) : la BDD "compte" 3 produits.
            // - Second appel de query (pour les données paginées) : la BDD retourne le tableau mockProducts
            dbClient.query = jest.fn()
                .mockResolvedValueOnce([{ total: 3 }])    // Simule : SELECT COUNT(*) FROM products
                .mockResolvedValueOnce(mockProducts);     // Simule : SELECT ... LIMIT ... OFFSET ...

            // 2. ACT
            // On exécute la méthode search(), sans critère, donc sur la page 1 (pagination par défaut)
            const result = await productDAO.search();

            // 3. ASSERTS
            // Vérifie que le "résultat" contient bien :
            // - le tableau mockProducts comme propriété products
            // - le total d'éléments égal à 3
            // - un bloc pagination complet avec valeurs par défaut (20 par page, page 1, 1 page au total, pas de page suivante)
            expect(result).toEqual({
                products: mockProducts,
                total: 3,
                pagination: { perPage: 20, page: 1, maxPage: 1, hasNext: false }
            });

            // Vérifie que la méthode query a été appelée exactement 2 fois (1 pour COUNT, 1 pour SELECT)
            expect(dbClient.query).toHaveBeenCalledTimes(2);

            // Vérifie le SQL du premier appel (dénombrement total)
            expect(dbClient.query.mock.calls[0][0]).toContain('COUNT(*)');

            // Vérifie les bons paramètres SQL du second appel (limit et offset par défaut)
            expect(dbClient.query.mock.calls[1][1]).toEqual([20, 0]);
        });

        test('Test 9 - Retourne un tableau vide si aucun produit', async () => {
            dbClient.query = jest.fn()
                .mockResolvedValueOnce([{ total: 0 }]);
            const result = await productDAO.findAll();
            expect(result).toEqual({
                products: [],
                pagination: {
                    perPage: 50, page: 1, maxPage: 0, total: 0
                }
            })
        });
    });

});

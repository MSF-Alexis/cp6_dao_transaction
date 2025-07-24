import DBClient from "#src/tests/mocks/DBClient.mock.js";
import { ProductDAO } from "#src/core/data/ProductDao.js";
import { validProduct, invalidProducts, mockProducts } from "#src/tests/fixtures/ProductData.js";

describe("[Product - DAO]", () => {
    let dbClient, productDAO;

    beforeEach(() => {
        dbClient = new DBClient();
        productDAO = new ProductDAO(dbClient);
    });

    describe("Phase 1 : tests SIMPLES", function () {
        describe("validateProduct()", function () {
            test("Test 1 - Accepte un produit valide", () => {
                expect(() => productDAO.validateProduct(validProduct)).not.toThrow();
            });

            test("Test 2 - Rejette un produit avec un nom trop court", () => {
                expect(() =>
                    productDAO.validateProduct(invalidProducts.shortName)
                ).toThrow("Le champ name doit contenir au moins 5 caractères");
            });

            test("Test 3 - Rejette un produit avec une description trop courte", () => {
                expect(() =>
                    productDAO.validateProduct(invalidProducts.shortDescription)
                ).toThrow(
                    "Le champ description doit contenir au moins 10 caractères"
                );
            });

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
        });

        describe("create()", function () {
            test("Test 6 - Crée un produit avec succès", async () => {
                const result = await productDAO.create(validProduct);
                expect(result.insertId).toBe(1);
            });

            test("Test 7 - Rejette un produit invalide avant transaction", async () => {
                await expect(productDAO.create(invalidProducts.shortName)).rejects.toThrow(
                    "Le champ name doit contenir au moins 5 caractères"
                );
                expect(dbClient.queries).toHaveLength(0);
            });
        });

        describe("findAll()", function () {
            test('Test 8 – Retourne tous les produits avec pagination par défaut', async () => {
                /* ========== 1. ARRANGE ========== */
                // 1er appel : SELECT COUNT(*) → total = 3
                // 2e appel : SELECT … LIMIT 50 OFFSET 0 → retourne mockProducts
                dbClient.query = jest.fn()
                    .mockResolvedValueOnce([{ total: 3 }])   // COUNT(*)
                    .mockResolvedValueOnce(mockProducts);    // SELECT paginé

                /* ========== 2. ACT ========== */
                // findAll() sans argument → limit 50, page 1
                const result = await productDAO.findAll();        // signature (limit = 50, offset = 0)

                /* ========== 3. ASSERT ========== */
                // a) Contenu retourné
                expect(result).toEqual({
                    products: mockProducts,
                    pagination: {
                        perPage: 50,
                        page: 1,
                        maxPage: 1,
                        total: 3
                    }
                });

                // b) Nombre d’appels SQL
                expect(dbClient.query).toHaveBeenCalledTimes(2);

                // c) Vérification du COUNT(*)
                expect(dbClient.query.mock.calls[0][0]).toContain('COUNT(*)');

                // d) Vérification du SELECT paginé (LIMIT 50 OFFSET 0)
                expect(dbClient.query.mock.calls[1][1]).toEqual([50, 0]);
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
                });
            });
        });

        describe("findById()", function () {
            /* Test 10 : Retourne un produit existant */
            test('Test 10 – Retourne un produit existant', async () => {
                // ARRANGE
                dbClient.query = jest.fn().mockResolvedValueOnce([mockProducts[0]]);

                // ACT
                const result = await productDAO.findById(1);

                // ASSERT
                expect(result).toEqual(mockProducts[0]);
                expect(dbClient.query).toHaveBeenCalledTimes(1);
                expect(dbClient.query.mock.calls[0][1]).toEqual([1]);
            });

            /* Test 11 : Retourne null pour un ID inexistant */
            test('Test 11 – Retourne null pour un ID inexistant', async () => {
                dbClient.query = jest.fn().mockResolvedValueOnce([]);

                const result = await productDAO.findById(999);

                expect(result).toBeNull();
                expect(dbClient.query).toHaveBeenCalledTimes(1);
            });

            /* Test 12 : Rejette un ID invalide */
            test.each([0, -5, 'abc'])(
                'Test 12 – Rejette un ID invalide (%p)',
                async invalidId => {
                    dbClient.query = jest.fn();
                    await expect(productDAO.findById(invalidId)).rejects.toThrow(
                        "L'ID doit être un entier positif"
                    );
                    expect(dbClient.query).not.toHaveBeenCalled();
                }
            );
        });

        describe("findByIdForUpdate()", function () {
            /* Test 13 : Retourne un produit avec verrouillage FOR UPDATE */
            test('Test 13 – Retourne un produit avec verrouillage FOR UPDATE', async () => {
                const row = mockProducts[1];
                dbClient.query = jest.fn().mockResolvedValueOnce([row]);

                const result = await productDAO.findByIdForUpdate(2);

                expect(result).toEqual(row);
                expect(dbClient.query.mock.calls[0][0]).toContain('FOR UPDATE');
            });

            /* Test 14 : Retourne null pour un ID inexistant */
            test('Test 14 – Retourne null pour un ID inexistant', async () => {
                dbClient.query = jest.fn().mockResolvedValueOnce([]);

                const result = await productDAO.findByIdForUpdate(888);

                expect(result).toBeNull();
            });
        });

        describe("update()", function () {
            /* Test 15 : Met à jour un produit existant avec des données valides */
            test('Test 15 – Met à jour un produit existant avec données valides', async () => {
                /* 1ᵉʳ query : vérifie existence  |  2ᵉ : UPDATE */
                dbClient.query = jest
                    .fn()
                    .mockResolvedValueOnce([{ id: 1 }])             // existence ok
                    .mockResolvedValueOnce({ result: { affectedRows: 1 } }); // update ok

                const ok = await productDAO.update(1, validProduct);

                expect(ok).toBe(true);
                expect(dbClient.query).toHaveBeenCalledTimes(2);
            });

            /* Test 16 : Retourne false / exception pour un ID inexistant */
            test('Test 16 – Retourne false pour un ID inexistant', async () => {
                dbClient.query = jest.fn().mockResolvedValueOnce([]); // pas trouvé

                await expect(productDAO.update(999, validProduct)).rejects.toThrow(
                    "Produit avec l'ID 999 non trouvé"
                );
            });
        });

        describe("updateStock()", function () {
            /* Test 17 : Décrémente le stock quand suffisant */
            test('Test 17 – Décrémente le stock quand suffisant', async () => {
                dbClient.query = jest
                    .fn()
                    .mockResolvedValueOnce([{ stock: 10 }])                // SELECT … FOR UPDATE
                    .mockResolvedValueOnce({ result: { affectedRows: 1 } });// UPDATE

                const ok = await productDAO.updateStock(1, 5);

                expect(ok).toBe(true);
            });

            /* Test 18 : Rejette si stock insuffisant */
            test('Test 18 – Rejette si stock insuffisant', async () => {
                dbClient.query = jest.fn().mockResolvedValueOnce([{ stock: 2 }]);

                await expect(productDAO.updateStock(1, 5)).rejects.toThrow(
                    /Stock insuffisant/
                );
            });
        });

        describe('delete()', () => {
            /* Test 19 : Supprime un produit sans commandes liées */
            test('Test 19 – Supprime un produit sans commandes liées', async () => {
                dbClient.query = jest
                    .fn()
                    .mockResolvedValueOnce([{ count: 0 }])               // aucune commande
                    .mockResolvedValueOnce({ result: { affectedRows: 1 } }); // DELETE

                const ok = await productDAO.delete(3);
                expect(ok).toBe(true);
            });

            /* Test 20 : Retourne false pour un ID inexistant */
            test('Test 20 – Retourne false pour un ID inexistant', async () => {
                dbClient.query = jest
                    .fn()
                    .mockResolvedValueOnce([{ count: 0 }])               // 0 commandes
                    .mockResolvedValueOnce({ result: { affectedRows: 0 } });// DELETE rien

                const ok = await productDAO.delete(999);
                expect(ok).toBe(false);
            });
        });

        describe('search()', () => {
            /* Test 21 : Recherche par nom avec résultats */
            test('Test 21 – Recherche par nom avec résultats', async () => {
                dbClient.query = jest
                    .fn()
                    .mockResolvedValueOnce([{ total: 1 }])   // COUNT
                    .mockResolvedValueOnce([mockProducts[0]]); // SELECT

                const result = await productDAO.search({ name: 'Burger' });

                expect(result.products).toHaveLength(1);
                expect(result.total).toBe(1);
                expect(dbClient.query.mock.calls[0][0]).toContain('WHERE name LIKE');
            });

            /* Test 22 : Retourne résultat vide si aucun match */
            test('Test 22 – Retourne résultat vide si aucun match', async () => {
                dbClient.query = jest
                    .fn()
                    .mockResolvedValueOnce([{ total: 0 }])   // COUNT
                    .mockResolvedValueOnce([]);              // SELECT vide

                const result = await productDAO.search({ name: 'Inexistant' });

                expect(result.products).toEqual([]);
                expect(result.total).toBe(0);
            });
        });

        describe('checkStock()', () => {
            /* Test 23 : Retourne true si stock suffisant */
            test('Test 23 – Retourne true si stock suffisant', async () => {
                dbClient.query = jest.fn().mockResolvedValueOnce([{ ...mockProducts[0], stock: 10 }]);

                const ok = await productDAO.checkStock(1, 5);
                expect(ok).toBe(true);
            });

            /* Test 24 : Retourne false si stock insuffisant */
            test('Test 24 – Retourne false si stock insuffisant', async () => {
                dbClient.query = jest.fn().mockResolvedValueOnce([{ ...mockProducts[0], stock: 2 }]);

                const ok = await productDAO.checkStock(1, 5);
                expect(ok).toBe(false);
            });
        });

        describe('count()', () => {
            /* Test 25 : Retourne le nombre total de produits */
            test('Test 25 – Retourne le nombre total de produits', async () => {
                dbClient.query = jest.fn().mockResolvedValueOnce([{ count: 42 }]);

                const total = await productDAO.count();
                expect(total).toBe(42);
            });

            /* Test 26 : Retourne 0 si aucun produit */
            test('Test 26 – Retourne 0 si aucun produit', async () => {
                dbClient.query = jest.fn().mockResolvedValueOnce([{ count: 0 }]);

                const total = await productDAO.count();
                expect(total).toBe(0);
            });
        });
    });

    describe("Phase 2 : tests MOYENS", function () {

        describe("validateProduct()", function () {
            describe("Test 27 - Rejette un produit invalide (champs obligatoires)", () => {
                test("Test 27.1 - Rejette un produit avec un prix null", () => {
                    const p = { ...invalidProducts.invalidPrice, price: null };
                    expect(() => productDAO.validateProduct(p)).toThrow(
                        "Le champ price est obligatoire"
                    );
                });

                test("Test 27.2 -Rejette un produit avec un stock null", () => {
                    const p = { ...invalidProducts.invalidStock, stock: null };
                    expect(() => productDAO.validateProduct(p)).toThrow(
                        "Le champ stock est obligatoire"
                    );
                });

                test("Test 27.3 - Rejette un produit avec un nom null", () => {
                    const p = { ...invalidProducts.shortName, name: null };
                    expect(() => productDAO.validateProduct(p)).toThrow(
                        "Le champ name est obligatoire"
                    );
                });

                test("Test 27.4 - Rejette un produit avec une description null", () => {
                    const p = { ...invalidProducts.shortDescription, description: null };
                    expect(() => productDAO.validateProduct(p)).toThrow(
                        "Le champ description est obligatoire"
                    );
                });
            });

            describe("Tests 28 - Rejette un produit invalide (types incorrects)", () => {
                test("Test 28.1 - Rejette un produit avec un prix de mauvais type", () => {
                    const p = { ...invalidProducts.invalidPrice, price: true };
                    expect(() => productDAO.validateProduct(p)).toThrow(
                        "Le champ price doit être de type number"
                    );
                });


                test("Test 28.2 - Rejette un produit avec un nom de mauvais type", () => {
                    const p = { ...invalidProducts.shortName, name: 123 };
                    expect(() => productDAO.validateProduct(p)).toThrow(
                        "Le champ name doit être de type string"
                    );
                });

                test("Test 28.3 - Rejette un produit avec une description de mauvais type", () => {
                    const p = { ...invalidProducts.shortDescription, description: false };
                    expect(() => productDAO.validateProduct(p)).toThrow(
                        "Le champ description doit être de type string"
                    );
                });

            });

            test("Test 29 - Rejette un produit avec un stock non entier", () => {
                const p = { ...invalidProducts.invalidStock, stock: 125.2 };
                expect(() => productDAO.validateProduct(p)).toThrow(
                    "Le champ stock doit être un entier"
                );
            });
        });

        describe("create()", () => {

            test("Test 30 - Effectue rollback en cas d'erreur de base de données", async () => {
                dbClient.failNext();
                await expect(productDAO.create(validProduct)).rejects.toThrow(
                    "DB error simulated"
                );
            });

            test("Test 31 – Gère l’échec de getConnection () du pool", async () => {
                dbClient.transaction = jest.fn().mockRejectedValue(new Error("Connection failed"));
                await expect(productDAO.create(validProduct)).rejects.toThrow("Connection failed");
                expect(dbClient.transaction).toHaveBeenCalledTimes(1);
            });

            test("Test 32 – Libère la connexion même en cas d’erreur (finally)", async () => {
                const fakeConn = {
                    beginTransaction: jest.fn(),
                    query: jest.fn().mockRejectedValue(new Error("DB crash")),
                    commit: jest.fn(),
                    rollback: jest.fn(),
                    release: jest.fn(),
                };
                dbClient.transaction = async work => {
                    try {
                        return await work(fakeConn);
                    } catch (e) {
                        fakeConn.rollback();
                        throw e;
                    } finally {
                        fakeConn.release();
                    }
                };
                await expect(productDAO.create(validProduct)).rejects.toThrow("DB crash");
                expect(fakeConn.rollback).toHaveBeenCalled();
                expect(fakeConn.release).toHaveBeenCalled();
            });

            test("Test 33 – Rollback si violation de clé unique (name)", async () => {
                /* 1. ARRANGE ----------------------------------------------------------- */
                const duplicateError = Object.assign(new Error("ER_DUP_ENTRY"), {
                    code: "ER_DUP_ENTRY",
                });
                // Simule l'erreur à la 1ʳᵉ requête SQL (INSERT)
                dbClient.query = jest.fn().mockRejectedValueOnce(duplicateError);



                /* 2. ACT --------------------------------------------------------------- */
                await expect(productDAO.create(validProduct)).rejects.toThrow(/ER_DUP_ENTRY/);

                /* 3. ASSERT ------------------------------------------------------------ */
                // Vérifie que le rollback et la libération ont été exécutés
                expect(dbClient.rollback).toHaveBeenCalledTimes(1);
                expect(dbClient.release).toHaveBeenCalledTimes(1);
            });

            test("Test 34 – Commit explicite après `create` réussi", async () => {
                dbClient.query = jest.fn().mockResolvedValueOnce({ insertId: 42 });
                const result = await productDAO.create(validProduct);
                expect(result.insertId).toBe(42);
                expect(dbClient.beginTransaction).toHaveBeenCalledTimes(1);
                expect(dbClient.commit).toHaveBeenCalledTimes(1);
            });

            test("Test 35 – Libère la connexion même après commit", async () => {
                /* 1. ARRANGE ----------------------------------------------------------- */
                dbClient.query = jest.fn().mockResolvedValueOnce({ insertId: 7 });   // INSERT OK
                dbClient.commit.mockImplementation(() => {
                    throw new Error("Post-commit crash");                  // panne après COMMIT
                });

                /* 2. ACT & ASSERT ------------------------------------------------------ */
                await expect(productDAO.create(validProduct))
                    .rejects.toThrow(/Post-commit crash/);

                // Le COMMIT doit avoir été tenté une seule fois
                expect(dbClient.commit).toHaveBeenCalledTimes(1);
                // La connexion doit quand même être libérée
                expect(dbClient.release).toHaveBeenCalledTimes(1);
            });

            test("Test 36 – Erreur `BEGIN` déclenche rollback automatique", async () => {
                /* 1. ARRANGE ----------------------------------------------------------- */
                // Simule échec dès l'ouverture de transaction
                dbClient.beginTransaction = jest
                    .fn()
                    .mockImplementation(() => {
                        throw new Error("BEGIN failed");                  // panne après COMMIT
                    });

                /* 2. ACT & ASSERT ------------------------------------------------------ */
                await expect(productDAO.create(validProduct)).rejects.toThrow(/BEGIN failed/);

                // Aucun commit ne doit survenir
                expect(dbClient.commit).not.toHaveBeenCalled();
                // Le rollback doit être tenté malgré l'échec du BEGIN
                expect(dbClient.rollback).toHaveBeenCalledTimes(1);
                expect(dbClient.release).toHaveBeenCalledTimes(1);
            });

            test("Test 37 – Timeout DB pendant `create` → rollback", async () => {
                /* 1. ARRANGE ----------------------------------------------------------- */
                const timeoutErr = Object.assign(new Error("Query timeout"), {
                    code: "PROTOCOL_SEQUENCE_TIMEOUT",
                });
                // INSERT lève un timeout
                dbClient.query = jest.fn().mockRejectedValueOnce(timeoutErr);

                /* 2. ACT --------------------------------------------------------------- */
                await expect(productDAO.create(validProduct)).rejects.toThrow(/timeout/);

                /* 3. ASSERT ------------------------------------------------------------ */
                expect(dbClient.rollback).toHaveBeenCalledTimes(1);
                expect(dbClient.release).toHaveBeenCalledTimes(1);
            });
        });

    });
});

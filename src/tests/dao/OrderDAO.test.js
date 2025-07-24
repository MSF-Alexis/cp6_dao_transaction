import DBClient from "#src/tests/mocks/DBClient.mock.js";
import { OrderDAO } from "#src/core/data/OrderDAO.js";
import { validOrder, invalidOrders, mockOrders } from "#src/tests/fixtures/OrderData.js";

describe("[Order - DAO]", () => {
    let dbClient, orderDAO;

    beforeEach(() => {
        dbClient = new DBClient();
        orderDAO = new OrderDAO(dbClient);
    });

    /*********************************************************************/
    /*  OrderDAO : Phase 1 – tests SIMPLES (numérotation 1 → 10)         */
    /*********************************************************************/

    /*******************************************************************
     * 1. Test 1 – Accepte une commande valide
     *******************************************************************/
    test("Test 1 – Accepte une commande valide", () => {
        expect(() => orderDAO.validateOrder(validOrder)).not.toThrow();
    });

    /*******************************************************************
     * 2. Test 2 – Rejette si la commande n'est pas un objet
     *    • Cas ciblés : null, string, nombre
     *******************************************************************/
    test.each([null, undefined, "string", 42])(
        "Test 2 – Rejette si la commande n'est pas un objet (%p)",
        value => {
            expect(() => orderDAO.validateOrder(value)).toThrow(
                "La commande doit être un objet"
            );
        }
    );

    /*******************************************************************
     * 3. Test 3 – Rejette un client sans nom
     *******************************************************************/
    test("Test 3 – Rejette un client sans nom", () => {
        expect(() =>
            orderDAO.validateOrder(invalidOrders.noCustomerName)
        ).toThrow("Le nom client est obligatoire");
    });

    /*******************************************************************
     * 4. Test 4 – Rejette un client avec nom < 2 caractères
     *******************************************************************/
    test("Test 4 – Rejette un client avec nom < 2 caractères", () => {
        expect(() =>
            orderDAO.validateOrder(invalidOrders.shortCustomerName)
        ).toThrow("Le nom client est obligatoire (≥ 2 caractères)");
    });

    /*******************************************************************
     * 5. Test 5 – Rejette si `items` n'est pas un tableau
     *******************************************************************/
    test("Test 5 – Rejette si `items` n'est pas un tableau", () => {
        expect(() =>
            orderDAO.validateOrder(invalidOrders.itemsNotArray)
        ).toThrow("La commande doit contenir au moins un item");
    });

    /*******************************************************************
     * 6. Test 6 – Rejette si `items` est vide
     *******************************************************************/
    test("Test 6 – Rejette si `items` est vide", () => {
        expect(() =>
            orderDAO.validateOrder(invalidOrders.emptyItems)
        ).toThrow("La commande doit contenir au moins un item");
    });

    /*******************************************************************
     * 7. Test 7 – Rejette un `productId` non entier
     *******************************************************************/
    test("Test 7 – Rejette un `productId` non entier", () => {
        expect(() =>
            orderDAO.validateOrder(invalidOrders.productIdNotInteger)
        ).toThrow("L'ID produit doit être un entier positif");
    });

    /*******************************************************************
     * 8. Test 8 – Rejette un `productId` négatif
     *******************************************************************/
    test("Test 8 – Rejette un `productId` négatif", () => {
        expect(() =>
            orderDAO.validateOrder(invalidOrders.productIdNegative)
        ).toThrow("L'ID produit doit être un entier positif");
    });

    /*******************************************************************
     * 9. Test 9 – Rejette une `quantity` non entière
     *******************************************************************/
    test("Test 9 – Rejette une `quantity` non entière", () => {
        expect(() =>
            orderDAO.validateOrder(invalidOrders.quantityNotInteger)
        ).toThrow("La quantité doit être un entier positif");
    });

    /*******************************************************************
     * 10. Test 10 – Rejette une `quantity` négative
     *******************************************************************/
    test("Test 10 – Rejette une `quantity` négative", () => {
        expect(() =>
            orderDAO.validateOrder(invalidOrders.quantityNegative)
        ).toThrow("La quantité doit être un entier positif");
    });
});
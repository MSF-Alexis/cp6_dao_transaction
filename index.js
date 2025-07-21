import { UserDAO } from "#dao/userDAO.js";

async function main() {
    try {
        const userDAO = new UserDAO();
        
        // Exemple de création d'un utilisateur
        const newUser = {
            name: "John Doe",
            email: "john.doe@example.com"
        };
        
        const result = await userDAO.create(newUser);
        console.log('Utilisateur créé:', result);
        
        // Exemple de récupération de tous les utilisateurs
        const users = await userDAO.findAll();
        console.log('Tous les utilisateurs:', users);
        
    } catch (error) {
        console.error('Erreur dans l\'application:', error);
    }
}

main();
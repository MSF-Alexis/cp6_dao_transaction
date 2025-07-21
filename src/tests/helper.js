import { resetMariadbMocks } from '#tests/mocks/database.mock.js';


export const setupTest = () => {
    resetMariadbMocks();
};

export const teardownTest = () => {
    resetMariadbMocks();
};
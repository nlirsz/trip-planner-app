import { auth } from './config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "firebase/auth";

/**
 * Handles user sign-up.
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 * @returns {Promise<UserCredential>}
 */
export function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Handles user login.
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 * @returns {Promise<UserCredential>}
 */
export function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Handles user logout.
 * @returns {Promise<void>}
 */
export function logout() {
    return signOut(auth);
}

/**
 * Sets up a listener for authentication state changes.
 * @param {function} onLogin Callback function to execute when a user logs in.
 * @param {function} onLogout Callback function to execute when a user logs out.
 */
export function handleAuthStateChanges(onLogin, onLogout) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            onLogin(user);
        } else {
            onLogout();
        }
    });
}

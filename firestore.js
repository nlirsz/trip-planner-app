import { db } from './config.js';
import { collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";

/**
 * Fetches all trips for a given user.
 * @param {string} userId The user's ID.
 * @returns {Promise<Array>} A promise that resolves to an array of trip objects.
 */
export async function getTrips(userId) {
    const tripsCol = collection(db, "users", userId, "trips");
    const tripSnapshot = await getDocs(tripsCol);
    return tripSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Creates a new trip document in Firestore.
 * @param {string} userId The user's ID.
 * @param {object} tripData The data for the new trip.
 * @returns {Promise<void>}
 */
export async function createTrip(userId, tripData) {
    const tripRef = doc(db, "users", userId, "trips", tripData.id);
    await setDoc(tripRef, tripData);
}

/**
 * Updates a trip document in Firestore.
 * @param {string} userId The user's ID.
 * @param {string} tripId The ID of the trip to update.
 * @param {object} dataToUpdate The data to update.
 * @returns {Promise<void>}
 */
export async function updateTrip(userId, tripId, dataToUpdate) {
    const tripRef = doc(db, "users", userId, "trips", tripId);
    await updateDoc(tripRef, dataToUpdate);
}

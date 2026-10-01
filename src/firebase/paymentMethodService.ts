import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from './config';
import { PaymentMethod } from '../types/PaymentMethod';
import { DEFAULT_PAYMENT_METHODS } from '../utils/paymentMethods';

export const paymentMethodService = {
  // Initialize default payment methods in Firestore with specific IDs for a user
  async initializePaymentMethods(userId?: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required to initialize payment methods');
    }
    try {
      console.log('Initializing default payment methods...');

      // Only create default payment methods that don't already exist for this user
      const existingMethods = await this.getPaymentMethods(userId);
      const existingIds = new Set(existingMethods.map(m => m.id));

      for (const method of DEFAULT_PAYMENT_METHODS) {
        if (existingIds.has(method.id)) {
          continue;
        }
        try {
          const methodDocRef = doc(db, `users/${userId}/paymentMethods`, method.id);

          const methodData = {
            name: String(method.name),
            createdAt: new Date().toISOString(),
            isActive: Boolean(method.isActive)
          };

          await setDoc(methodDocRef, methodData);

          console.log(`✓ Initialized payment method: ${method.name} (ID: ${method.id})`);
        } catch (methodError) {
          console.error(`Failed to create payment method ${method.name}:`, methodError);
          throw methodError;
        }
      }

      console.log('Default payment methods initialization completed successfully');
    } catch (error) {
      console.error('Error initializing payment methods:', error);
      throw error;
    }
  },

  // Get all payment methods for a user
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const methodsCollection = collection(db, `users/${userId}/paymentMethods`);
      const q = query(methodsCollection, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PaymentMethod));
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  },

  // Get active payment methods only for a user
  async getActivePaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const methodsCollection = collection(db, `users/${userId}/paymentMethods`);
      const q = query(
        methodsCollection,
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PaymentMethod));
    } catch (error) {
      console.error('Error getting active payment methods:', error);
      throw error;
    }
  },

  // Add a new payment method for a user
  async addPaymentMethod(userId: string, methodData: Omit<PaymentMethod, 'id'>): Promise<string> {
    try {
      const methodsCollection = collection(db, `users/${userId}/paymentMethods`);
      const docRef = await addDoc(methodsCollection, {
        ...methodData,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  },

  // Update payment method
  async updatePaymentMethod(userId: string, methodId: string, updates: Partial<PaymentMethod>): Promise<void> {
    try {
      const methodDoc = doc(db, `users/${userId}/paymentMethods`, methodId);
      await updateDoc(methodDoc, updates);
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  },

  // Soft delete payment method (set isActive to false)
  async deactivatePaymentMethod(userId: string, methodId: string): Promise<void> {
    try {
      const methodDoc = doc(db, `users/${userId}/paymentMethods`, methodId);
      await updateDoc(methodDoc, { isActive: false });
    } catch (error) {
      console.error('Error deactivating payment method:', error);
      throw error;
    }
  },

  // Hard delete payment method
  async deletePaymentMethod(userId: string, methodId: string): Promise<void> {
    try {
      const methodDoc = doc(db, `users/${userId}/paymentMethods`, methodId);
      await deleteDoc(methodDoc);
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }
};

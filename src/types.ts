/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export type CampType = 'national' | 'private';

export interface CampSite {
  id: string;
  name: string;
  nameEn: string;
  type: CampType;
  province: string;
  latitude: number;
  longitude: number;
  rating: number;
  priceRange: string;
  description: string;
  longDescription: string;
  image: string;
  gallery: string[];
  amenities: string[];
  contact: string;
  season: string;
  elevation: string; // e.g. "海拔 800 เมตร"
}

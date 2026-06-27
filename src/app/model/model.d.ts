export interface Show {
  id?: number | string;
  name?: string;
  location?: string;
  date?: number;
  description?: string;
  shortDescription?: string;
  reservationLink?: string;
  price?: number;
  reducedPrice?: number;
  imgLink?: string;
  logoLink?: string;
  isHighlighted?: boolean;
  freeForStudents?:boolean;
  isPublished?: boolean;
}

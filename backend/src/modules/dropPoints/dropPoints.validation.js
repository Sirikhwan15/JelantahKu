'use strict';
const { z } = require('zod');

const fields = {
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(150),
  address: z.string().trim().min(5, 'Alamat minimal 5 karakter').max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  operatingHours: z.string().trim().max(100),
  contactPhone: z.string().trim().regex(/^\+?[0-9]{8,15}$/, 'Nomor telepon tidak valid'),
  isActive: z.boolean(),
};

const bothOrNone = (v) => (v.latitude === undefined) === (v.longitude === undefined);
const pairMsg = 'Latitude dan longitude harus diisi berpasangan';

const createDropPointSchema = z
  .object({
    name: fields.name,
    address: fields.address,
    latitude: fields.latitude.optional(),
    longitude: fields.longitude.optional(),
    operatingHours: fields.operatingHours.optional(),
    contactPhone: fields.contactPhone.optional(),
  })
  .refine(bothOrNone, pairMsg);

const updateDropPointSchema = z
  .object(fields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Isi minimal satu field yang ingin diubah');

module.exports = { createDropPointSchema, updateDropPointSchema };

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Factura extends Model
{
    use HasFactory;

    protected $fillable = [
        'serie',
        'correlativo',
        'fecha_emision',
        'tipo_doc_cliente',
        'num_doc_cliente',
        'nombre_cliente',
        'direccion_cliente',
        'subtotal',
        'igv',
        'total',
        'estado',
        'company_id',
        'sunat_response',
        'pdf_path',
        'xml_path',
        'cdr_path'
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'subtotal' => 'float',
        'igv' => 'float',
        'total' => 'float',
        'sunat_response' => 'array'
    ];

    // Relación con la empresa
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    // Relación con los detalles de la factura
    public function detalles()
    {
        return $this->hasMany(FacturaDetalle::class);
    }
}

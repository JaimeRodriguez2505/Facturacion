<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FacturaDetalle extends Model
{
    use HasFactory;

    protected $fillable = [
        'factura_id',
        'descripcion',
        'cantidad',
        'precio_unitario',
        'subtotal'
    ];

    protected $casts = [
        'cantidad' => 'float',
        'precio_unitario' => 'float',
        'subtotal' => 'float'
    ];

    // Relación con la factura
    public function factura()
    {
        return $this->belongsTo(Factura::class);
    }
}

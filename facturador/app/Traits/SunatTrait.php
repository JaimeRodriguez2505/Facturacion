<?php


namespace App\Traits;

use Luecano\NumeroALetras\NumeroALetras;

trait SunatTrait{

    public function setTotales(&$data)
    {
        $details = collect($data['details']);

        // Monto Operaciones
        $data['mtoOperGravadas'] = $details->where('tipAfeIgv', 10)->sum('mtoValorVenta');
        $data['mtoOperExoneradas'] = $details->where('tipAfeIgv', 20)->sum('mtoValorVenta');
        $data['mtoOperInafectas'] = $details->where('tipAfeIgv', 30)->sum('mtoValorVenta');
        $data['mtoOperExportacion'] = $details->where('tipAfeIgv', 40)->sum('mtoValorVenta');
        $data['mtoOperGratuitas'] = $details->whereNotIn('tipAfeIgv', [10,20,30,40])->sum('mtoValorVenta');

        // Impuestos
        $data['mtoIGV'] = $details->whereIn('tipAfeIgv', [10,20,30,40])->sum('igv');
        $data['mtoIGVGratuitas'] = $details->whereNotIn('tipAfeIgv', [10,20,30,40])->sum('igv');
        $data['icbper'] = $details->sum('icbper');
        $data['totalImpuestos'] = $data['mtoIGV'] + $data['icbper'];

        // Valor Venta y Subtotal
        $data['valorVenta'] = $details->whereIn('tipAfeIgv', [10,20,30,40])->sum('mtoValorVenta');
        $data['subTotal'] = $data['valorVenta'] + $data['mtoIGV'];

        // Redondeo
        $data['mtoImpVenta'] = floor($data['subTotal'] * 10) / 10;
        $data['redondeo'] = $data['mtoImpVenta'] - $data['subTotal'];
    }

    /**
     * Agrega leyenda del importe en letras al array $data.
     */
    public function setLegends(&$data)
    {
        $formatter = new NumeroALetras();

        // Genera la leyenda: "SON ... SOLES"
        $data['legends'] = [
            [
                'code'  => '1000',  // Catálogo 52
                'value' => $formatter->toInvoice($data['mtoImpVenta'], 2, 'SOLES')
            ]
        ];
    }
}
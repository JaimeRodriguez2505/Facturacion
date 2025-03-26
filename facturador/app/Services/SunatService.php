<?php

namespace App\Services;

use App\Models\Company as ModelsCompany;
use DateTime;
use Greenter\Model\Client\Client;
use Greenter\Model\Company\Address;
use Greenter\Model\Company\Company;
use Greenter\Model\Sale\FormaPagos\FormaPagoContado;
use Greenter\Model\Sale\Invoice;
use Greenter\Model\Sale\Legend;
use Greenter\Model\Sale\Note;
use Greenter\Model\Sale\SaleDetail;
use Greenter\Report\HtmlReport;
use Greenter\Report\PdfReport;
use Greenter\Report\Resolver\DefaultTemplateResolver;
use Greenter\See;
use Greenter\Ws\Services\SunatEndpoints;
use Illuminate\Contracts\Cache\Store;
use Illuminate\Support\Facades\Storage;
use Nette\Utils\Html;
use Pest\Mutate\Mutators\Sets\DefaultSet;

class SunatService
{
    public function getSee($company)
    {
        $see = new See();
        // Cargar certificado desde tu almacenamiento
        $see->setCertificate(Storage::get($company->cert_path));
        // Endpoint: Producción o Beta
        $see->setService($company->production ? SunatEndpoints::FE_PRODUCCION : SunatEndpoints::FE_BETA);
        // Credenciales del SOL
        $see->setClaveSOL($company->ruc, $company->sol_user, $company->sol_pass);

        return $see;
    }


    public function getInvoice($data)
    {
        return (new Invoice())
            ->setUblVersion($data['ublVersion'] ?? '2.1')
            ->setTipoOperacion($data['tipoOperacion'] ?? null)      // 0101: Venta (Catálogo 51)
            ->setTipoDoc($data['tipoDoc'] ?? null)                  // 01 = Factura (Catálogo 01)
            ->setSerie($data['serie'] ?? null)
            ->setCorrelativo($data['correlativo'] ?? null)
            ->setFechaEmision(new DateTime($data['fechaEmision']) ?? null) // Fecha Emisión
            ->setFormaPago(new FormaPagoContado())          // Contado
            ->setTipoMoneda($data['tipoMoneda'] ?? null)            // PEN = Sol (Catálogo 02)
            ->setCompany($this->getCompany($data['company']))
            ->setClient($this->getClient($data['client']))

            // Monto Operaciones
            ->setMtoOperGravadas($data['mtoOperGravadas'])
            ->setMtoOperExoneradas($data['mtoOperExoneradas'])
            ->setMtoOperInafectas($data['mtoOperInafectas'])
            ->setMtoOperExportacion($data['mtoOperExportacion'])
            ->setMtoOperGratuitas($data['mtoOperGratuitas'])

            // Impuestos
            ->setMtoIGV($data['mtoIGV'])
            ->setMtoIGVGratuitas($data['mtoIGVGratuitas'])
            ->setIcbper($data['icbper'])
            ->setTotalImpuestos($data['totalImpuestos'])

            // Totales
            ->setValorVenta($data['valorVenta'])
            ->setSubTotal($data['subTotal'])
            ->setRedondeo($data['redondeo'])
            ->setMtoImpVenta($data['mtoImpVenta'])

            // Detalles / Productos
            ->setDetails($this->getDetails($data['details']))

            // Leyendas
            ->setLegends($this->getLegends($data['legends']));
    }

    public function getNote($data)
    {
        return (new Note)
            ->setUblVersion($data['ublVersion'] ?? '2.1')
            ->setTipoDoc($data['tipoDoc'] ?? null)                  // 01 = Factura (Catálogo 01)
            ->setSerie($data['serie'] ?? null)
            ->setCorrelativo($data['correlativo'] ?? null)
            ->setFechaEmision(new DateTime($data['fechaEmision']) ?? null)
            ->setTipDocAfectado($data['tipDocAfectado'] ?? null)
            ->setNumDocfectado($data['numDocfectado'] ?? null)
            ->setCodMotivo($data['codMotivo'] ?? null)
            ->setDesMotivo($data['desMotivo'] ?? null)
            ->setTipoMoneda($data['tipoMoneda'] ?? null)
            ->setCompany($this->getCompany($data['company']))
            ->setClient($this->getClient($data['client']))

            // Monto Operaciones
            ->setMtoOperGravadas($data['mtoOperGravadas'])
            ->setMtoOperExoneradas($data['mtoOperExoneradas'])
            ->setMtoOperInafectas($data['mtoOperInafectas'])
            ->setMtoOperExportacion($data['mtoOperExportacion'])
            ->setMtoOperGratuitas($data['mtoOperGratuitas'])

            // Impuestos
            ->setMtoIGV($data['mtoIGV'])
            ->setMtoIGVGratuitas($data['mtoIGVGratuitas'])
            ->setIcbper($data['icbper'])
            ->setTotalImpuestos($data['totalImpuestos'])

            // Totales
            ->setValorVenta($data['valorVenta'])
            ->setSubTotal($data['subTotal'])
            ->setRedondeo($data['redondeo'])
            ->setMtoImpVenta($data['mtoImpVenta'])

            // Detalles / Productos
            ->setDetails($this->getDetails($data['details']))

            // Leyendas
            ->setLegends($this->getLegends($data['legends']));
    }

    public function getCompany($company)
    {
        return (new Company())
            ->setRuc($company['ruc'] ?? null)
            ->setRazonSocial($company['razonSocial'] ?? null)
            ->setNombreComercial($company['nombreComercial'] ?? null)
            ->setAddress($this->getAddress($company['address']));
    }

    public function getClient($client)
    {
        return (new Client())
            ->setTipoDoc($client['tipoDoc'] ?? null) // 6 = RUC (Catálogo 06), 1 = DNI, etc.
            ->setNumDoc($client['numDoc'] ?? null)
            ->setRznSocial($client['rznSocial']) ?? null;
    }

    public function getAddress($adress)
    {
        return (new Address())
            ->setUbigueo($adress['ubigueo'] ?? null)
            ->setDepartamento($adress['departamento'] ?? null)
            ->setProvincia($adress['provincia'] ?? null)
            ->setDistrito($adress['distrito'] ?? null)
            ->setUrbanizacion($adress['urbanizacion'] ?? null)
            ->setDireccion($adress['direccion'] ?? null)
            ->setCodLocal($adress['codLocal']) ?? null; // 0000 por defecto si no hay otro
    }

    public function getDetails($details)
    {
        $green_details = [];
        foreach ($details as $item) {
            $green_details[] = (new SaleDetail())
                ->setCodProducto($item['codProducto'] ?? null)
                ->setUnidad($item['unidad'] ?? null) // p.ej. NIU (Catálogo 03)
                ->setCantidad($item['cantidad'] ?? null)
                ->setMtoValorUnitario($item['mtoValorUnitario'] ?? null)
                ->setDescripcion($item['descripcion'] ?? null)
                ->setMtoBaseIgv($item['mtoBaseIgv'] ?? null)
                ->setPorcentajeIgv($item['porcentajeIgv'] ?? null) // 18%
                ->setIgv($item['igv'] ?? null)
                ->setFactorIcbper($item['factorIcbper'] ?? null) // Ej: 0.30 (para 2023)
                ->setIcbper($item['icbper'] ?? null)
                ->setTipAfeIgv($item['tipAfeIgv'] ?? null)         // 10 = Gravado (Catálogo 07)
                ->setTotalImpuestos($item['totalImpuestos'] ?? null)
                ->setMtoValorVenta($item['mtoValorVenta'] ?? null)
                ->setMtoPrecioUnitario($item['mtoPrecioUnitario'] ?? null);
        }
        return $green_details;
    }

    public function getLegends($legends)
    {
        $green_legends = [];
        foreach ($legends as $legend) {
            $green_legends[] = (new Legend())
                ->setCode($legend['code'] ?? null)   // 1000 = Monto en letras (Catálogo 52)
                ->setValue($legend['value'] ?? null);
        }
        return $green_legends;
    }

    public function sunatResponse($result)
    {
        $response['success'] = $result->isSuccess();

        // Verificamos si la conexión con SUNAT fue exitosa
        if (!$response['success']) {
            $response['error'] = [
                'code' => $result->getError()->getCode(),
                'message' => $result->getError()->getMessage()
            ];
            return $response;
        }

        $response['cdrZip'] = base64_encode($result->getCdrZip());
        $cdr = $result->getCdrResponse();

        $response['cdrResponse'] = [
            'code' => (int)$cdr->getCode(),
            'description' => $cdr->getDescription(),
            'notes' => $cdr->getNotes()
        ];

        return $response;
    }

    public function getHtmlReport($invoice)
    {

        $report = new HtmlReport();

        $resolver = new DefaultTemplateResolver();

        $report->setTemplate($resolver->getTemplate($invoice));


        $ruc = $invoice->getCompany()->getRuc();
        $company = ModelsCompany::where('ruc', $ruc)
            ->where('user_id', auth()->id())
            ->first();

        $params = [
            'system' => [
                'logo' => Storage::get($company->logo_path), // Logo de Empresa
                'hash' => 'qqnr2dN4p/HmaEA/CJuVGo7dv5g=', // Valor Resumen 
            ],
            'user' => [
                'header'     => 'Telf: <b>(01) 123375</b>', // Texto que se ubica debajo de la dirección de empresa
                'extras'     => [
                    // Leyendas adicionales
                    ['name' => 'CONDICION DE PAGO', 'value' => 'Efectivo'],
                    ['name' => 'VENDEDOR', 'value' => 'GITHUB SELLER'],
                ],
                'footer' => '<p>Nro Resolucion: <b>3232323</b></p>'
            ]
        ];
        return $report->render($invoice, $params);
    }

    public function generatePdfReport($invoice)
    {
        $htmlReport = new HtmlReport();

        $resolver = new DefaultTemplateResolver();
        $htmlReport->setTemplate($resolver->getTemplate($invoice));

        $ruc = $invoice->getCompany()->getRuc();
        $company = ModelsCompany::where('ruc', $ruc)
            ->where('user_id', auth()->id())
            ->first();

        $report = new PdfReport($htmlReport);
        $report->setOptions([
            'no-outline',
            'viewport-size' => '1280x1024',
            'page-width' => '21cm',
            'page-height' => '29.7cm',
        ]);

        $report->setBinPath(env('WKHTMLTOPDF_PATH'));

        $params = [
            'system' => [
                'logo' => Storage::get($company->logo_path), // Logo de Empresa
                'hash' => 'qqnr2dN4p/HmaEA/CJuVGo7dv5g=', // Valor Resumen 
            ],
            'user' => [
                'header'     => 'Telf: <b>(01) 123375</b>', // Texto que se ubica debajo de la dirección de empresa
                'extras'     => [
                    // Leyendas adicionales
                    ['name' => 'CONDICION DE PAGO', 'value' => 'Efectivo'],
                    ['name' => 'VENDEDOR', 'value' => 'GITHUB SELLER'],
                ],
                'footer' => '<p>Nro Resolucion: <b>3232323</b></p>'
            ]
        ];

        $pdf = $report->render($invoice, $params);

        // Guardar el PDF en el almacenamiento
        Storage::put('invoices/' . $invoice->getName() . '.pdf', $pdf);

        // Devolver el contenido del PDF
        return $pdf;
    }
}

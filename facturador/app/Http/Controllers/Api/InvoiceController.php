<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Greenter\See;
use Greenter\Model\DocumentInterface;
use DateTime;
use Greenter\Ws\Services\SunatEndpoints;
use App\Models\Company;
use App\Services\SunatService;
use App\Traits\SunatTrait;
use Greenter\Model\Client\Client;
use Greenter\Model\Company\Company as CompanyCompany;
use Greenter\Model\Company\Address;
use Greenter\Model\Sale\FormaPagos\FormaPagoContado;
use Greenter\Model\Sale\Invoice;
use Greenter\Model\Sale\SaleDetail;
use Greenter\Model\Sale\Legend;
use Greenter\Report\XmlUtils;
use Luecano\NumeroALetras\NumeroALetras;



class InvoiceController extends Controller
{
    use SunatTrait;
    public function send(Request $request)
{
    $request->validate([
        'company' => 'required|array',
        'company.address' => 'required|array',
        'client' => 'required|array',
        'details' => 'required|array',
        'details.*' => 'required|array',
    ]);

    $data = $request->all();

    // Se asume que el usuario está autenticado y se filtra por su RUC
    $company = Company::where('user_id', auth()->id())
        ->where('ruc', $data['company']['ruc'])
        ->firstOrFail();

    // Calcula totales e inserta la leyenda (monto en letras) en $data
    $this->setTotales($data);
    $this->setLegends($data);

    // Se obtienen las credenciales y configuración para SUNAT
    $sunat = new SunatService();
    $see = $sunat->getSee($company);

    // Se crea la factura (Invoice) con todos los campos
    $invoice = $sunat->getInvoice($data);

    // Envía la factura a SUNAT
    $result = $see->send($invoice);

    // Genera el XML firmado
    $xml = $see->getFactory()->getLastXml();

    // Obtiene el hash de la firma
    $hash = (new XmlUtils())->getHashSign($xml);

    // Procesa la respuesta de SUNAT
    $sunatResponse = $sunat->sunatResponse($result);

    // Se prepara la respuesta final, agregando la data procesada para visualizarla
    $response = [
        'xml'           => $xml,
        'hash'          => $hash,
        'sunatResponse' => $sunatResponse,
        'data'          => $data, // Aquí se incluye la data original procesada
    ];

    return response()->json($response, 200);
}


    public function xml(Request $request ){
        $request->validate([
            'company' => 'required|array',
            'company.address' => 'required|array',
            'client' => 'required|array',
            'details' => 'required|array',
            'details.*' => 'required|array',
        ]);

        $data = $request->all();
        $company = Company::where('user_id', auth()->id())
            ->where('ruc', $data['company']['ruc'])
            ->firstOrFail();

        // Calcula totales e inserta la leyenda (monto en letras) en $data
        $this->setTotales($data);
        $this->setLegends($data);

        $sunat = new SunatService();
        $see = $sunat->getSee($company);
        $invoice = $sunat->getInvoice($data);

        $response['xml'] = $see->getXmlSigned($invoice);
        $response['hash'] = (new XmlUtils())->getHashSign($response['xml']);
        
        return response()->json($response, 200);
    }
    
    public function pdf(Request $request){
        $request->validate([
            'company' => 'required|array',
            'company.address' => 'required|array',
            'client' => 'required|array',
            'details' => 'required|array',
            'details.*' => 'required|array',
        ]);

        $data = $request->all();
        $company = Company::where('user_id', auth()->id())
            ->where('ruc', $data['company']['ruc'])
            ->firstOrFail();

        // Calcula totales e inserta la leyenda (monto en letras) en $data
        $this->setTotales($data);
        $this->setLegends($data);

        $sunat = new SunatService();

        $invoice = $sunat->getInvoice($data);

        $sunat->generatePdfReport($invoice);

        return $sunat->getHtmlReport($invoice);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\SunatService;
use App\Traits\SunatTrait;
use Greenter\Report\XmlUtils;
use Illuminate\Http\Request;

class NoteController extends Controller
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
        $company = Company::where('user_id', auth()->id())
            ->where('ruc', $data['company']['ruc'])
            ->firstOrFail();
        
        // Calcula totales e inserta la leyenda (monto en letras) en $data
        $this->setTotales($data);
        $this->setLegends($data);

        $sunat = new SunatService();
        $see = $sunat->getSee($company);
        
        $note = $sunat->getNote($data);

        $result = $see->send($note);

        // Genera el XML firmado
        $response['xml'] = $see->getFactory()->getLastXml();

        // Obtiene el hash de la firma
        $response['hash'] = (new XmlUtils())->getHashSign($response['xml']);

        // Procesa la respuesta de SUNAT
        $response['sunatResponse'] = $sunat->sunatResponse($result);

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
        $note = $sunat->getNote($data);

        $response['xml'] = $see->getXmlSigned($note);
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

        $note = $sunat->getInvoice($data);

        return $sunat->getHtmlReport($note);
    }
}

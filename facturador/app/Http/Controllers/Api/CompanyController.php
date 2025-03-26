<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Rules\UniqueRucRule;

class CompanyController extends Controller
{
    /**
     * Muestra la lista de empresas del usuario autenticado.
     */
    public function index()
    {
        $companies = Company::where('user_id', auth()->id())->get();

        return response()->json([
            'company' => $companies
        ], 200);
    }

    /**
     * Almacena una nueva empresa.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'razon_social' => 'required|string',
            'ruc' => [
                'required',
                'string',
                'regex:/^(10|20)\d{9}$/',
                new UniqueRucRule()
            ],
            'direccion' => 'required|string',
            'logo' => 'nullable|image',
            'sol_user' => 'required|string',
            'sol_pass' => 'required|string',
            // Para el certificado digital, se acepta extensión .pem, .txt o .p12
            'cert' => 'required|file|mimes:pem,txt,p12',
            'client_id' => 'nullable|string',
            'client_secret' => 'nullable|string',
            'production' => 'nullable|boolean',
        ]);

        if ($request->hasFile('logo')) {
            $data['logo_path'] = $request->file('logo')->store('logos');
        }

        $data['cert_path'] = $request->file('cert')->store('certs');
        $data['user_id'] = auth()->id();

        $company = Company::create($data);

        return response()->json([
            'message' => 'Empresa creada con éxito',
            'company' => $company
        ], 201);
    }

    /**
     * Muestra los detalles de una empresa dado su RUC.
     */
    public function show($ruc)
    {
        $company = Company::where('ruc', $ruc)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        return response()->json([
            'company' => $company
        ], 200);
    }

    /**
     * Actualiza una empresa existente.
     */
    public function update(Request $request, $ruc)
    {
        $company = Company::where('ruc', $ruc)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $data = $request->validate([
            'razon_social' => 'nullable|string|min:5',
            'ruc' => [
                'nullable',
                'string',
                'regex:/^(10|20)\d{9}$/',
                new UniqueRucRule($company->id)
            ],
            'direccion' => 'nullable|string|min:5',
            'logo' => 'nullable|image',
            'sol_user' => 'nullable|string|min:5',
            'sol_pass' => 'nullable|string|min:5',
            // Se permite actualizar el certificado digital con extensión .pem o .txt
            'cert' => 'nullable|file|mimes:pem,txt',
            'client_id' => 'nullable|string',
            'client_secret' => 'nullable|string',
            'production' => 'nullable|boolean',
        ]);

        if ($request->hasFile('logo')) {
            $data['logo_path'] = $request->file('logo')->store('logos');
        }
        if ($request->hasFile('cert')) {
            $data['cert_path'] = $request->file('cert')->store('certs');
        }

        $company->update($data);

        return response()->json([
            'message' => 'Empresa actualizada con éxito',
            'company' => $company
        ], 200);
    }

    /**
     * Elimina una empresa.
     */
    public function destroy($ruc)
    {
        $company = Company::where('ruc', $ruc)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $company->delete();

        return response()->json([
            'message' => 'Empresa eliminada con éxito'
        ], 200);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use App\Models\FacturaDetalle;
use App\Models\Company;
use App\Services\SunatService;
use App\Traits\SunatTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class FacturaController extends Controller
{
    use SunatTrait;

    public function __construct(
        protected SunatService $sunatService
    ) {}

    /**
     * Obtener todas las facturas del usuario actual
     */
    public function index(): JsonResponse
    {
        $user = auth()->user();
        $companies = $user->companies->pluck('id');

        $facturas = Factura::whereIn('company_id', $companies)
            ->with('detalles')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'facturas' => $facturas
        ]);
    }

    /**
     * Crear una nueva factura
     */
    public function store(Request $request): JsonResponse
    {
        // Validar los datos de entrada
        $validator = Validator::make($request->all(), [
            'serie' => 'required|string',
            'correlativo' => 'required|string',
            'fecha_emision' => 'required|date',
            'tipo_doc_cliente' => 'required|string',
            'num_doc_cliente' => 'required|string',
            'nombre_cliente' => 'required|string',
            'subtotal' => 'required|numeric',
            'igv' => 'required|numeric',
            'total' => 'required|numeric',
            'company_id' => 'required|exists:companies,id',
            'detalles' => 'required|array',
            'detalles.*.descripcion' => 'required|string',
            'detalles.*.cantidad' => 'required|numeric',
            'detalles.*.precio_unitario' => 'required|numeric',
            'detalles.*.subtotal' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verificar que la empresa pertenece al usuario
        $company = Company::where('id', $request->company_id)
            ->where('user_id', auth()->id())
            ->first();

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'La empresa no pertenece al usuario'
            ], 403);
        }

        try {
            DB::beginTransaction();

            // Crear la factura
            $factura = Factura::create([
                'serie' => $request->serie,
                'correlativo' => $request->correlativo,
                'fecha_emision' => $request->fecha_emision,
                'tipo_doc_cliente' => $request->tipo_doc_cliente,
                'num_doc_cliente' => $request->num_doc_cliente,
                'nombre_cliente' => $request->nombre_cliente,
                'direccion_cliente' => $request->direccion_cliente,
                'subtotal' => $request->subtotal,
                'igv' => $request->igv,
                'total' => $request->total,
                'estado' => 'Pendiente',
                'company_id' => $request->company_id,
            ]);

            // Crear los detalles de la factura
            foreach ($request->detalles as $detalle) {
                FacturaDetalle::create([
                    'factura_id' => $factura->id,
                    'descripcion' => $detalle['descripcion'],
                    'cantidad' => $detalle['cantidad'],
                    'precio_unitario' => $detalle['precio_unitario'],
                    'subtotal' => $detalle['subtotal'],
                ]);
            }

            DB::commit();

            // Cargar los detalles para la respuesta
            $factura->load('detalles');

            return response()->json([
                'success' => true,
                'message' => 'Factura creada correctamente',
                'factura' => $factura
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la factura',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar una factura específica
     */
    public function show(string $id): JsonResponse
    {
        $user = auth()->user();
        $companies = $user->companies->pluck('id');

        $factura = Factura::whereIn('company_id', $companies)
            ->with('detalles')
            ->find($id);

        if (!$factura) {
            return response()->json([
                'success' => false,
                'message' => 'Factura no encontrada'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'factura' => $factura
        ]);
    }

    /**
     * Actualizar el estado de una factura
     */
    public function updateEstado(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'required|in:Pendiente,Pagada,Vencida,Anulada',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = auth()->user();
        $companies = $user->companies->pluck('id');

        $factura = Factura::whereIn('company_id', $companies)->find($id);

        if (!$factura) {
            return response()->json([
                'success' => false,
                'message' => 'Factura no encontrada'
            ], 404);
        }

        $factura->estado = $request->estado;
        $factura->save();

        return response()->json([
            'success' => true,
            'message' => 'Estado de factura actualizado correctamente',
            'factura' => $factura
        ]);
    }

    /**
     * Anular una factura
     */
    public function destroy(string $id): JsonResponse
    {
        $user = auth()->user();
        $companies = $user->companies->pluck('id');

        $factura = Factura::whereIn('company_id', $companies)->find($id);

        if (!$factura) {
            return response()->json([
                'success' => false,
                'message' => 'Factura no encontrada'
            ], 404);
        }

        // Cambiar el estado a anulada en lugar de eliminar
        $factura->estado = 'Anulada';
        $factura->save();

        return response()->json([
            'success' => true,
            'message' => 'Factura anulada correctamente'
        ]);
    }

    /**
     * Generar PDF de la factura
     */
    public function generarPDF(string $id): JsonResponse|\Symfony\Component\HttpFoundation\Response
    {
        $user = auth()->user();
        $companies = $user->companies->pluck('id');

        $factura = Factura::whereIn('company_id', $companies)
            ->with('detalles', 'company')
            ->find($id);

        if (!$factura) {
            return response()->json([
                'success' => false,
                'message' => 'Factura no encontrada'
            ], 404);
        }

        try {
            // Preparar datos para Greenter
            $company = $factura->company;
            $invoiceData = $this->prepareInvoiceData($factura);

            // Obtener el objeto Invoice de Greenter
            $invoice = $this->sunatService->getInvoice($invoiceData);

            // Generar PDF y obtener el contenido
            $pdfContent = $this->sunatService->generatePdfReport($invoice);

            // Actualizar ruta del PDF en la factura
            $pdfPath = 'invoices/' . $invoice->getName() . '.pdf';
            $factura->pdf_path = $pdfPath;
            $factura->save();

            // Devolver el PDF como respuesta
            return response($pdfContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $invoice->getName() . '.pdf"'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar el PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enviar factura a SUNAT
     */
    public function enviarSunat(string $id): JsonResponse
    {
        $user = auth()->user();
        $companies = $user->companies->pluck('id');

        $factura = Factura::whereIn('company_id', $companies)
            ->with('detalles', 'company')
            ->find($id);

        if (!$factura) {
            return response()->json([
                'success' => false,
                'message' => 'Factura no encontrada'
            ], 404);
        }

        try {
            // Preparar datos para Greenter
            $company = $factura->company;
            $invoiceData = $this->prepareInvoiceData($factura);

            // Obtener el objeto Invoice de Greenter
            $invoice = $this->sunatService->getInvoice($invoiceData);

            // Obtener el objeto See de Greenter
            $see = $this->sunatService->getSee($company);

            // Enviar a SUNAT
            $result = $see->send($invoice);

            // Procesar respuesta
            $response = $this->sunatService->sunatResponse($result);

            // Actualizar factura con la respuesta de SUNAT
            $factura->sunat_response = $response;

            // Si fue exitoso, generar PDF y XML
            if ($response['success']) {
                // Generar PDF si no existe
                if (!$factura->pdf_path) {
                    $this->sunatService->generatePdfReport($invoice);
                    $factura->pdf_path = 'invoices/' . $invoice->getName() . '.pdf';
                }

                // Guardar CDR
                $cdrPath = 'invoices/cdr/' . $invoice->getName() . '.zip';
                Storage::put($cdrPath, base64_decode($response['cdrZip']));
                $factura->cdr_path = $cdrPath;

                // Actualizar estado
                $factura->estado = 'Pagada';
            }

            $factura->save();

            return response()->json([
                'success' => true,
                'message' => $response['success'] ? 'Factura enviada correctamente a SUNAT' : 'Error al enviar a SUNAT',
                'response' => $response,
                'factura' => $factura
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al enviar la factura a SUNAT',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Preparar datos de la factura para Greenter
     */
    private function prepareInvoiceData(Factura $factura): array
    {
        $company = $factura->company;
        $detalles = $factura->detalles;

        // Datos de la empresa
        $companyData = [
            'ruc' => $company->ruc,
            'razonSocial' => $company->razon_social,
            'nombreComercial' => $company->razon_social,
            'address' => [
                'ubigueo' => '150101',
                'departamento' => 'LIMA',
                'provincia' => 'LIMA',
                'distrito' => 'LIMA',
                'urbanizacion' => '',
                'direccion' => $company->direccion,
                'codLocal' => '0000'
            ]
        ];

        // Datos del cliente
        $clientData = [
            'tipoDoc' => $factura->tipo_doc_cliente,
            'numDoc' => $factura->num_doc_cliente,
            'rznSocial' => $factura->nombre_cliente
        ];

        // Detalles de la factura
        $detailsData = [];
        foreach ($detalles as $detalle) {
            $valorUnitario = $detalle->precio_unitario / 1.18; // Precio sin IGV
            $igv = $detalle->subtotal * 0.18;

            $detailsData[] = [
                'codProducto' => 'P' . str_pad($detalle->id, 3, '0', STR_PAD_LEFT),
                'unidad' => 'NIU', // Unidad (Catálogo 03)
                'cantidad' => $detalle->cantidad,
                'mtoValorUnitario' => round($valorUnitario, 2),
                'descripcion' => $detalle->descripcion,
                'mtoBaseIgv' => $detalle->subtotal,
                'porcentajeIgv' => 18,
                'igv' => round($igv, 2),
                'factorIcbper' => 0,
                'icbper' => 0,
                'tipAfeIgv' => 10, // Gravado (Catálogo 07)
                'totalImpuestos' => round($igv, 2),
                'mtoValorVenta' => $detalle->subtotal,
                'mtoPrecioUnitario' => $detalle->precio_unitario
            ];
        }

        // Datos de la factura
        $invoiceData = [
            'ublVersion' => '2.1',
            'tipoOperacion' => '0101', // Venta (Catálogo 51)
            'tipoDoc' => '01', // Factura (Catálogo 01)
            'serie' => $factura->serie,
            'correlativo' => $factura->correlativo,
            'fechaEmision' => $factura->fecha_emision->format('Y-m-d'),
            'tipoMoneda' => 'PEN', // Sol (Catálogo 02)
            'company' => $companyData,
            'client' => $clientData,
            'details' => $detailsData,
            'mtoOperGravadas' => $factura->subtotal,
            'mtoOperExoneradas' => 0,
            'mtoOperInafectas' => 0,
            'mtoOperExportacion' => 0,
            'mtoOperGratuitas' => 0,
            'mtoIGV' => $factura->igv,
            'mtoIGVGratuitas' => 0,
            'icbper' => 0,
            'totalImpuestos' => $factura->igv,
            'valorVenta' => $factura->subtotal,
            'subTotal' => $factura->total,
            'redondeo' => 0,
            'mtoImpVenta' => $factura->total
        ];

        // Agregar leyenda
        $this->setLegends($invoiceData);

        return $invoiceData;
    }
}

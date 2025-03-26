<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('facturas', function (Blueprint $table) {
            $table->id();
            $table->string('serie');
            $table->string('correlativo');
            $table->date('fecha_emision');
            $table->string('tipo_doc_cliente');
            $table->string('num_doc_cliente');
            $table->string('nombre_cliente');
            $table->string('direccion_cliente')->nullable();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('igv', 10, 2);
            $table->decimal('total', 10, 2);
            $table->enum('estado', ['Pendiente', 'Pagada', 'Vencida', 'Anulada'])->default('Pendiente');
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->json('sunat_response')->nullable();
            $table->string('pdf_path')->nullable();
            $table->string('xml_path')->nullable();
            $table->string('cdr_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facturas');
    }
};
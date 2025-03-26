<?php

use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Controller;
use Greenter\Model\Sale\Invoice;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('register', [RegisterController::class, 'store']);
Route::post('login', [AuthController::class, 'login']);
Route::post('logout', [AuthController::class, 'logout']);
Route::post('refresh', [AuthController::class, 'refresh']);
Route::post('me', [AuthController::class, 'me']);

Route::apiResource('companies', CompanyController::class)->middleware('auth:api');

//invoices
Route::post('invoices/send',[InvoiceController::class, 'send'])->middleware('auth:api');
Route::post('invoices/xml',[InvoiceController::class, 'xml'])->middleware('auth:api');
Route::post('invoices/pdf',[InvoiceController::class, 'pdf'])->middleware('auth:api');


//Notes
Route::post('notes/send',[NoteController::class, 'send'])->middleware('auth:api');
Route::post('notes/xml',[NoteController::class, 'xml'])->middleware('auth:api');
Route::post('notes/pdf',[NoteController::class, 'pdf'])->middleware('auth:api');

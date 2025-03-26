<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
// Contrato requerido para JWT
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    /**
     * Atributos asignables
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * Atributos ocultos para arrays
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Retorna el identificador del JWT
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Retorna los claims personalizados del JWT
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    //Relación uno a muchos
    public function companies(){
        return $this->hasMany(Company::class);
    }
}

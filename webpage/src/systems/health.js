import * as THREE from "three";

function createHealthSystem () {
    let health = 100;

    function takeDamage ( amount ) {
        health -= amount;
        
        console.log("Health: " + health);

        if ( health <= 0 ) {
            console.log("Ouch!");
            health = 100;
        }
    }

    return {
        takeDamage,
        getHealth: () => health
    }
}

export { createHealthSystem }
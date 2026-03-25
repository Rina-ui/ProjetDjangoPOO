import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createBien, extractCreatedBienId, fetchCategories, fetchTypesBien, type Bien, type Categorie, type CreateBienPayload, type TypeBien, updateBien, uploadBienPhotos } from "../services/biens";

const MAX_PHOTO_COUNT = 10;
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const formatApiError = (data: unknown): string => {
    if (!data) {
        return "Echec de creation du bien.";
    }

    if (typeof data === "string") {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map((item) => String(item)).join(" | ");
    }

    if (typeof data === "object") {
        const entries = Object.entries(data as Record<string, unknown>);
        if (entries.length === 0) {
            return "Echec de creation du bien.";
        }

        return entries
            .map(([key, value]) => {
                if (Array.isArray(value)) {
                    return `${key}: ${value.map((item) => String(item)).join(", ")}`;
                }
                return `${key}: ${String(value)}`;
            })
            .join(" | ");
    }

    return "Echec de creation du bien.";
};

const extractOwnerIdForWrite = (bien: Bien | null, fallback: number): number => {
    if (!bien) {
        return fallback;
    }

    if (typeof bien.proprietaire === "number") {
        return bien.proprietaire;
    }

    if (bien.proprietaire && typeof bien.proprietaire === "object" && typeof bien.proprietaire.id === "number") {
        return bien.proprietaire.id;
    }

    return fallback;
};

type AddBienFormProps = {
    proprietaireId: number;
    mode?: "create" | "edit";
    initialBien?: Bien | null;
    onSubmitPayload?: (payload: CreateBienPayload, sourceBien: Bien | null) => Promise<void> | void;
    onClose: () => void;
    onSuccess?: () => void;
};

const AddBienForm = ({ proprietaireId, mode = "create", initialBien = null, onSubmitPayload, onClose, onSuccess }: AddBienFormProps) => {
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [typesBien, setTypesBien] = useState<TypeBien[]>([]);
    const [loadingLists, setLoadingLists] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [categorie, setCategorie] = useState<number>(0);
    const [typeBien, setTypeBien] = useState<number>(0);
    const [adresse, setAdresse] = useState("");
    const [description, setDescription] = useState("");
    const [equipementsInput, setEquipementsInput] = useState("");
    const [photosFiles, setPhotosFiles] = useState<File[]>([]);
    const [loyerHc, setLoyerHc] = useState("");
    const [charges, setCharges] = useState("");
    const [statut, setStatut] = useState<"VACANT" | "LOUE" | "EN_TRAVAUX">("VACANT");

    const isEditMode = mode === "edit";

    const handlePhotosChange = (filesList: FileList | null) => {
        if (!filesList) {
            return;
        }

        const incomingFiles = Array.from(filesList);
        const currentCount = photosFiles.length;
        const remainingSlots = MAX_PHOTO_COUNT - currentCount;

        if (remainingSlots <= 0) {
            setErrorMsg(`Maximum ${MAX_PHOTO_COUNT} photos.`);
            return;
        }

        const validatedFiles: File[] = [];

        for (const file of incomingFiles.slice(0, remainingSlots)) {
            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                setErrorMsg("Formats autorises: JPG, PNG, WEBP.");
                continue;
            }

            if (file.size > MAX_PHOTO_SIZE_BYTES) {
                setErrorMsg("Une photo depasse 5 Mo.");
                continue;
            }

            validatedFiles.push(file);
        }

        if (validatedFiles.length > 0) {
            setErrorMsg("");
            setPhotosFiles((prev) => [...prev, ...validatedFiles]);
        }
    };

    const removePhoto = (targetName: string) => {
        setPhotosFiles((prev) => prev.filter((file) => file.name !== targetName));
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [cats, types] = await Promise.all([fetchCategories(), fetchTypesBien()]);
                setCategories(cats);
                setTypesBien(types);

                if (cats.length > 0) {
                    setCategorie(cats[0].id);
                }
            } catch (error) {
                setErrorMsg("Impossible de charger categories/types de bien.");
            } finally {
                setLoadingLists(false);
            }
        };

        void loadData();
    }, []);

    const filteredTypes = useMemo(
        () => typesBien.filter((item) => item.categorie === categorie),
        [typesBien, categorie]
    );

    useEffect(() => {
        if (filteredTypes.length === 0) {
            setTypeBien(0);
            return;
        }

        if (!filteredTypes.some((item) => item.id === typeBien)) {
            setTypeBien(filteredTypes[0].id);
        }
    }, [filteredTypes, typeBien]);

    useEffect(() => {
        if (!initialBien) {
            return;
        }

        setCategorie(initialBien.categorie || 0);
        setTypeBien(initialBien.type_bien || 0);
        setAdresse(initialBien.adresse || "");
        setDescription(initialBien.description || "");
        setEquipementsInput((initialBien.equipements || []).join(", "));
        setLoyerHc(String(initialBien.loyer_hc ?? ""));
        setCharges(String(initialBien.charges ?? ""));
        if (initialBien.statut === "VACANT" || initialBien.statut === "LOUE" || initialBien.statut === "EN_TRAVAUX") {
            setStatut(initialBien.statut);
        }
    }, [initialBien]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!categorie || !typeBien || !adresse || !description || !loyerHc || !charges) {
            setErrorMsg("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        setSubmitting(true);

        try {
            const equipements = equipementsInput
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

            const ownerIdForPayload = isEditMode
                ? extractOwnerIdForWrite(initialBien, proprietaireId)
                : proprietaireId;

            const payload: CreateBienPayload = {
                proprietaire: ownerIdForPayload,
                categorie,
                type_bien: typeBien,
                adresse,
                description,
                photos: photosFiles,
                equipements,
                loyer_hc: Number(loyerHc),
                charges: Number(charges),
                statut,
            };

            console.log("[POST /api/biens/] payload:", payload);
            if (onSubmitPayload) {
                await onSubmitPayload(payload, initialBien);
            } else {
                if (isEditMode && initialBien?.id) {
                    await updateBien(initialBien.id, { ...payload, photos: [] });

                    if (photosFiles.length > 0) {
                        try {
                            console.log("[POST /api/biens/{id}/upload-photos/] files:", photosFiles.map((f) => f.name));
                            await uploadBienPhotos(initialBien.id, photosFiles);
                        } catch (uploadError: any) {
                            console.error("[POST /api/biens/{id}/upload-photos/] status:", uploadError?.response?.status);
                            console.error("[POST /api/biens/{id}/upload-photos/] response:", uploadError?.response?.data);
                            setErrorMsg(`Bien modifie, mais l'upload des photos a echoue: ${formatApiError(uploadError?.response?.data)}`);
                            return;
                        }
                    }
                } else {
                    const createResponse = await createBien({ ...payload, photos: [] });
                    const createdBienId = extractCreatedBienId(createResponse?.data);

                    console.log("[POST /api/biens/] response:", createResponse?.data);
                    console.log("[POST /api/biens/] created id:", createdBienId);

                    if (!createdBienId) {
                        throw new Error("Creation reussie mais id du bien introuvable dans la reponse.");
                    }

                    if (photosFiles.length > 0) {
                        try {
                            console.log("[POST /api/biens/{id}/upload-photos/] files:", photosFiles.map((f) => f.name));
                            await uploadBienPhotos(createdBienId, photosFiles);
                        } catch (uploadError: any) {
                            console.error("[POST /api/biens/{id}/upload-photos/] status:", uploadError?.response?.status);
                            console.error("[POST /api/biens/{id}/upload-photos/] response:", uploadError?.response?.data);
                            setErrorMsg(`Bien cree, mais l'upload des photos a echoue: ${formatApiError(uploadError?.response?.data)}`);
                            return;
                        }
                    }
                }
            }
            setSuccessMsg(isEditMode ? "Bien modifie avec succes." : "Bien ajoute avec succes.");
            onSuccess?.();
        } catch (error: any) {
            const data = error?.response?.data;
            console.error(isEditMode ? "[EDIT bien] status:" : "[POST /api/biens/] status:", error?.response?.status);
            console.error(isEditMode ? "[EDIT bien] response:" : "[POST /api/biens/] response:", data);
            setErrorMsg(formatApiError(data));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card add-bien-card">
            <div className="card-hd add-bien-header">
                <span className="card-title">{isEditMode ? "Modifier le bien" : "Ajouter un bien"}</span>
                <button className="btn-ghost" onClick={onClose} type="button">Fermer</button>
            </div>

            {loadingLists && <p className="add-bien-loading">Chargement des listes...</p>}
            {errorMsg && <p className="error-msg">{errorMsg}</p>}
            {successMsg && <p className="add-bien-success">{successMsg}</p>}

            <form className="add-bien-form" onSubmit={handleSubmit}>

                <div className="input-group">
                    <select
                        value={categorie || ""}
                        onChange={(event) => setCategorie(Number(event.target.value))}
                        disabled={loadingLists}
                        className="add-bien-select"
                    >
                        {categories.map((item) => (
                            <option key={item.id} value={item.id}>{item.nom}</option>
                        ))}
                    </select>
                    <label>Categorie</label>
                </div>

                <div className="input-group">
                    <select
                        value={typeBien || ""}
                        onChange={(event) => setTypeBien(Number(event.target.value))}
                        disabled={loadingLists || filteredTypes.length === 0}
                        className="add-bien-select"
                    >
                        {filteredTypes.map((item) => (
                            <option key={item.id} value={item.id}>{item.nom}</option>
                        ))}
                    </select>
                    <label>Type de bien</label>
                </div>

                <div className="input-group">
                    <select
                        value={statut}
                        onChange={(event) => setStatut(event.target.value as "VACANT" | "LOUE" | "EN_TRAVAUX")}
                        className="add-bien-select"
                    >
                        <option value="VACANT">VACANT</option>
                        <option value="LOUE">LOUE</option>
                        <option value="EN_TRAVAUX">EN_TRAVAUX</option>
                    </select>
                    <label>Statut</label>
                </div>

                <div className="input-group add-bien-full">
                    <input type="text" value={adresse} onChange={(event) => setAdresse(event.target.value)} placeholder=" " />
                    <label>Adresse</label>
                </div>

                <div className="input-group add-bien-full">
                    <input type="text" value={description} onChange={(event) => setDescription(event.target.value)} placeholder=" " />
                    <label>Description</label>
                </div>

                <div className="input-group add-bien-full">
                    <input
                        type="text"
                        value={equipementsInput}
                        onChange={(event) => setEquipementsInput(event.target.value)}
                        placeholder=" "
                    />
                    <label>Equipements (separes par virgule)</label>
                </div>

                <div className="input-group add-bien-full">
                    <input
                        className="add-bien-file-input"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                            handlePhotosChange(event.target.files);
                            // Reset input value so selecting same file again still triggers onChange.
                            event.currentTarget.value = "";
                        }}
                    />
                    <label>Photos depuis votre PC (optionnel, max 10)</label>
                </div>

                {photosFiles.length > 0 && (
                    <div className="add-bien-file-list">
                        {photosFiles.map((file) => (
                            <div key={file.name} className="add-bien-file-chip">
                                <span>{file.name}</span>
                                <button
                                    type="button"
                                    className="add-bien-file-remove"
                                    onClick={() => removePhoto(file.name)}
                                >
                                    x
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="input-group">
                    <input type="number" value={loyerHc} onChange={(event) => setLoyerHc(event.target.value)} placeholder=" " min={0} />
                    <label>Loyer HC</label>
                </div>

                <div className="input-group">
                    <input type="number" value={charges} onChange={(event) => setCharges(event.target.value)} placeholder=" " min={0} />
                    <label>Charges</label>
                </div>

                <div className="add-bien-actions">
                    <button className="btn-ghost" type="button" onClick={onClose}>Annuler</button>
                    <button className="dl-add-btn" type="submit" disabled={submitting || loadingLists}>
                        {submitting ? "Envoi..." : isEditMode ? "Enregistrer les modifications" : "Enregistrer le bien"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddBienForm;


